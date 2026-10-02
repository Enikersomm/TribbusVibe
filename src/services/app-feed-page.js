// 🪐 Tribbu'sVibe - Controlador Completo do Feed Cronológico
// Arquivo: src/services/app-feed-page.js

import { 
  db, 
  auth 
} from "./tribbusFirebase.js";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  increment, 
  getDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { 
  postarMicroVibe, 
  escutarFeedTempoReal, 
  enviarComentarioPost, 
  escutarComentariosDoPost 
} from "./firebase-config.js";
import { 
  postarStoryComunidade, 
  escutarStoriesComunidade 
} from "./firebase-stories.js";
import { 
  lancarVibeFlexivel, 
  fazerUploadDeFoto 
} from "./firebase-stories-flexivel.js";
import { 
  fazerUploadDeAudio 
} from "./firebase-storage.js";
import { abrirVisualizadorStory } from "./story-viewer.js";
import { abrirModalPostarVibe } from "./modal-postar-vibe.js";

// 🪐 Tribbu'sVibe - Calculadora Dinâmica de Tempo de Postagem
function calcularTempoTranscorrido(dataPost) {
    if (!dataPost) return "agora há pouco";

    // Converte a data do Firebase (Timestamp) para o formato de data do JavaScript
    const dataPostagem = dataPost.seconds ? new Date(dataPost.seconds * 1000) : new Date(dataPost);
    const agora = new Date();
    const diferencaEmSegundos = Math.floor((agora - dataPostagem) / 1000);

    if (diferencaEmSegundos < 60) return "agora há pouco";
    
    const diferencaEmMinutos = Math.floor(diferencaEmSegundos / 60);
    if (diferencaEmMinutos < 60) return `há ${diferencaEmMinutos} min`;
    
    const diferencaEmHoras = Math.floor(diferencaEmMinutos / 60);
    if (diferencaEmHoras < 24) return `há ${diferencaEmHoras} h`;
    
    const diferencaEmDias = Math.floor(diferencaEmHoras / 24);
    if (diferencaEmDias === 1) return "ontem";
    return `há ${diferencaEmDias} dias`;
}

// 🪐 Tribbu'sVibe - Renderizador Multimídia Híbrido do Mural de Vibes
export function renderizarConteudoVibeModal(tipo, dado, corFundo) {
    const modalArea = document.getElementById("modal-vibe-visualizador-conteudo") || document.getElementById("story-viewer-content");
    if (!modalArea) return;

    modalArea.innerHTML = ""; // Limpa a tela do modal anterior

    // 🎥 SE FOR CLIPE DE VÍDEO (Estilo TikTok Vertical)
    if (tipo === "video") {
        modalArea.innerHTML = `
            <div style="position: relative; width: 100%; max-width: 400px; height: 75vh; margin: 0 auto; background: #000; border-radius: 20px; overflow: hidden; border: 2px solid var(--ciano-neon); box-shadow: 0 0 25px rgba(0, 240, 255, 0.4);">
                <video src="${dado}" autoplay controls loop playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
            </div>
        `;
    } 
    // 🎧 SE FOR TRILHA SONORA OU GRAVAÇÃO EM MP3
    else if (tipo === "musica" || tipo === "audio") {
        modalArea.innerHTML = `
            <div style="background: var(--cinza-card); padding: 30px; border-radius: 20px; text-align: center; border: 2px solid #FFD700; box-shadow: 0 0 25px rgba(255, 215, 0, 0.3); display: flex; flex-direction: column; align-items: center; gap: 15px; width: 100%; max-width: 380px;">
                <div style="width: 80px; height: 80px; background: var(--cinza-input); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 2.5rem; color: #FFD700; animation: pulsarLogo 1.5s infinite;">
                    <i class="fas fa-compact-disc fa-spin"></i>
                </div>
                <h4 style="color: var(--branco); margin: 0;">Trilha Sonora da Tribo</h4>
                <p style="font-size: 0.85rem; color: var(--texto-suave); margin: 0;">Ouvindo vibe por voz ou música em MP3</p>
                <audio src="${dado}" autoplay controls style="width: 100%; margin-top: 10px; accent-color: #FFD700;"></audio>
            </div>
        `;
    } 
    // 📝 SE FOR TEXTO NEON OU FOTO COMUM (Fallback seguro)
    else {
        if (tipo === "texto") {
            modalArea.innerHTML = `
                <div style="background: ${corFundo || 'var(--cinza-card)'}; width: 100%; max-width: 400px; height: 60vh; border-radius: 20px; display: flex; justify-content: center; align-items: center; padding: 25px; border: 2px solid var(--pink-magenta); box-shadow: 0 0 25px rgba(255, 0, 127, 0.35); box-sizing: border-box;">
                    <h2 style="font-size: 1.8rem; font-weight: 900; text-align: center; background: var(--gradient-supremo); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">${dado}</h2>
                </div>
            `;
        } else {
            modalArea.innerHTML = `<img src="${dado}" style="width: 100%; max-height: 70vh; border-radius: 16px; object-fit: contain; border: 2px solid var(--ciano-neon);" onerror="this.onerror=null; this.src='/logo.png';" />`;
        }
    }
}

export function configurarInteracoesDoCard(card, post, usuarioAtual) {
    const btnCurtir = card.querySelector(".btn-curtir");
    const btnComentar = card.querySelector(".btn-comentar-gaveta");
    const gaveta = card.querySelector(`#gaveta-post-${post.id}`);
    const listaInner = card.querySelector(".lista-respostas-inner");
    const txtCurtidasCount = card.querySelector(".curtidas-num");

    if (!btnCurtir || !btnComentar || !gaveta || !listaInner) return;

    // 🔒 1. TRAVA ANTIAUTO-CURTIDA
    btnCurtir.onclick = async () => {
        const meuUID = auth?.currentUser?.uid || usuarioAtual?.uid;
        
        if (post.autor_id === meuUID || post.autor_uid === meuUID) {
            alert("⚠️ Você não pode curtir sua própria publicação, malandro! Deixe que a Tribu avalie. 😉");
            return;
        }

        try {
            const postRef = doc(db, "feed_posts", post.id);
            await updateDoc(postRef, { 
                curtidas_contador: increment(1)
            });
            btnCurtir.style.color = "var(--pink-magenta)";
        } catch (err) {
            console.error("Erro ao processar curtida:", err);
        }
    };

    // 📡 2. ESCUTA DE COMENTÁRIOS EM TEMPO REAL NA GAVETA (onSnapshot)
    let escutaGavetaAtiva = null;

    btnComentar.onclick = () => {
        const aberta = gaveta.style.display === "block";
        gaveta.style.display = aberta ? "none" : "block";

        if (!aberta && !escutaGavetaAtiva) {
            console.log(`Abrindo cano ao vivo para comentários do post: ${post.id}`);
            
            const qComentarios = query(
                collection(db, "feed_posts", post.id, "comentarios"),
                orderBy("data_criacao", "asc")
            );

            // Inicia a escuta dinâmica do Firebase
            escutaGavetaAtiva = onSnapshot(qComentarios, (snapshot) => {
                listaInner.innerHTML = "";
                
                if (snapshot.empty) {
                    listaInner.innerHTML = `<div style="font-size: 0.75rem; color: var(--texto-suave); font-style: italic; padding: 5px;">Nenhuma resposta por enquanto... ✨</div>`;
                    return;
                }

                snapshot.forEach((docSnap) => {
                    const c = docSnap.data();
                    const item = document.createElement("div");
                    item.style.background = "var(--cinza-input, #18181b)";
                    item.style.padding = "8px 10px";
                    item.style.borderRadius = "8px";
                    item.style.marginBottom = "6px";
                    item.style.borderLeft = "2px solid var(--ciano-neon)";
                    item.innerHTML = `
                        <strong style="color: var(--ciano-neon); font-size: 0.75rem;">${escapeHTML(c.autor_name || 'Membro')}</strong>
                        <p style="font-size: 0.8rem; margin: 2px 0 0 0; color: #FFF;">${escapeHTML(c.conteudo_texto || '')}</p>
                    `;
                    listaInner.appendChild(item);
                });
                
                // Força a rolagem automática para a última resposta enviada
                listaInner.scrollTop = listaInner.scrollHeight;
            });
        }
    };
}

export function iniciarFeedPage() {
  console.log("🪐 [Tribbu'sVibe] Inicializando Feed Central...");

  let usuarioAtual = {
    uid: "user_anonimo",
    nome: "Membro Vibe",
    avatar: "👤",
    status: "Na vibe antialgoritmo ✨"
  };

  let ultimoAvatarUrlRenderizado = "";
  let ultimoNomeRenderizado = "";

  // 1. CARREGAR DADOS DO USUÁRIO LOGADO
  onAuthStateChanged(auth, async (user) => {
    const lblAvatar = document.getElementById("lbl-avatar-logado");
    const lblNome = document.getElementById("lbl-nome-logado");
    const lblStatus = document.getElementById("lbl-status-logado");
    const barraConfiavel = document.querySelector(".id-barra-confiavel");
    const barraLegal = document.querySelector(".id-barra-legal");
    const barraVibe = document.querySelector(".id-barra-vibe");

    if (user) {
      usuarioAtual.uid = user.uid;
      usuarioAtual.nome = user.displayName || (user.email ? user.email.split("@")[0] : "Membro Vibe");

      // Tenta buscar o perfil detalhado no Firestore
      try {
        if (db && user.uid) {
          const userDocSnap = await getDoc(doc(db, "usuarios", user.uid));
          if (userDocSnap.exists()) {
            const dados = userDocSnap.data();
            usuarioAtual.nome = dados.nome || usuarioAtual.nome;
            usuarioAtual.avatar = dados.avatar_emoji || dados.avatar || "👤";
            if (dados.avatar_url && typeof dados.avatar_url === "string" && (dados.avatar_url.trim().startsWith("http") || dados.avatar_url.trim().startsWith("data:image"))) {
              usuarioAtual.avatar_url = dados.avatar_url;
            }
            usuarioAtual.status = dados.frase_status || dados.recado || "Conectando pessoas de verdade 🪐";
            usuarioAtual.medidor_confiavel = dados.medidor_confiavel ?? 0;
            usuarioAtual.medidor_legal = dados.medidor_legal ?? 0;
            usuarioAtual.medidor_vibe = dados.medidor_vibe ?? 0;
          }
        }
      } catch (e) {
        console.warn("[Feed] Usando dados da sessão Auth:", e);
      }
    } else {
      // Verifica dados salvos no localStorage (modo rápido ou offline)
      const nomeSalvo = localStorage.getItem("tribbus_user_nome");
      const emojiSalvo = localStorage.getItem("tribbus_user_avatar");
      if (nomeSalvo) usuarioAtual.nome = nomeSalvo;
      if (emojiSalvo) usuarioAtual.avatar = emojiSalvo;
    }

    // Só atualiza os elementos se o avatar ou URL realmente tiverem mudado (evita piscar em loop)
    const avatarKey = usuarioAtual.avatar_url || usuarioAtual.avatar || "👤";
    if (avatarKey !== ultimoAvatarUrlRenderizado) {
      ultimoAvatarUrlRenderizado = avatarKey;

      if (lblAvatar) {
        if (usuarioAtual.avatar_url) {
          lblAvatar.innerHTML = `<img src="${usuarioAtual.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" onerror="this.onerror=null; this.parentElement.innerText='👤';">`;
        } else {
          lblAvatar.textContent = usuarioAtual.avatar || "👤";
        }
      }

      const previewImg = document.getElementById("story-criar-preview-img");
      if (previewImg && usuarioAtual.avatar_url) {
        if (previewImg.src !== usuarioAtual.avatar_url) {
          previewImg.src = usuarioAtual.avatar_url;
        }
      }
    }

    if (lblNome && usuarioAtual.nome !== ultimoNomeRenderizado) {
      ultimoNomeRenderizado = usuarioAtual.nome;
      lblNome.textContent = usuarioAtual.nome;
    }
    if (lblStatus) lblStatus.textContent = usuarioAtual.status;

    // Termômetros com animação suave zerados para novos usuários
    if (barraConfiavel) barraConfiavel.style.width = `${usuarioAtual.medidor_confiavel ?? 0}%`;
    if (barraLegal) barraLegal.style.width = `${usuarioAtual.medidor_legal ?? 0}%`;
    if (barraVibe) barraVibe.style.width = `${usuarioAtual.medidor_vibe ?? 0}%`;
  });

  // 2. MURAL DE VIBES FLEXÍVEL (STORIES DAS TRIBOS EM TEMPO REAL)
  const containerStories = document.getElementById("container-stories-realtime");
  const abasTipo = document.querySelectorAll(".btn-aba-tipo");
  const fileUpload = document.getElementById("file-vibe-upload");
  const fileGaleria = document.getElementById("file-vibe-galeria");
  const fileCamera = document.getElementById("file-vibe-camera");
  const containerSeletorFoto = document.getElementById("container-seletor-foto");
  const btnAbrirGaleria = document.getElementById("btn-abrir-galeria");
  const btnAbrirCamera = document.getElementById("btn-abrir-camera");
  const containerPreviewFoto = document.getElementById("container-preview-foto");
  const imgPreviewFoto = document.getElementById("img-preview-foto");
  const btnRemoverFoto = document.getElementById("btn-remover-foto");
  const inputVibeDado = document.getElementById("input-vibe-dado");
  const btnDispararVibe = document.getElementById("btn-disparar-vibe");
  const txtSemVibes = document.getElementById("txt-sem-vibes");

  // Controles de Gravação de Áudio de 15s
  const containerGravadorAudio = document.getElementById("container-gravador-audio");
  const btnGravarAudio = document.getElementById("btn-gravar-audio");
  const btnStopAudio = document.getElementById("btn-stop-audio");
  const iconGravarAudio = document.getElementById("icon-gravar-audio");
  const labelGravarAudio = document.getElementById("label-gravar-audio");
  const btnOuvirAudio = document.getElementById("btn-ouvir-audio");
  const iconOuvirAudio = document.getElementById("icon-ouvir-audio");
  const labelOuvirAudio = document.getElementById("label-ouvir-audio");
  const btnDescartarAudio = document.getElementById("btn-descartar-audio");
  const audioTimer = document.getElementById("audio-timer");
  const audioProgressBar = document.getElementById("audio-progress-bar");
  const audioGravadoStatus = document.getElementById("audio-gravado-status");

  let tipoSelecionado = "foto";
  let arquivoFotoUrl = "";

  // Estado da Gravação de Áudio via Web MediaRecorder
  let mediaRecorder = null;
  let audioStream = null;
  let audioChunks = [];
  let gravacaoAudioDataUrl = "";
  let gravacaoTimerInterval = null;
  let tempoRestante = 15;
  let audioPreviewPlayer = null;
  let isGravando = false;
  let storyAudioAtivo = null;

  // Função para parar e limpar a gravação
  function pararGravacaoAudio(cancelar = false) {
    if (gravacaoTimerInterval) {
      clearInterval(gravacaoTimerInterval);
      gravacaoTimerInterval = null;
    }
    isGravando = false;

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
      audioStream = null;
    }

    if (btnStopAudio) btnStopAudio.style.display = "none";
    if (btnGravarAudio) {
      btnGravarAudio.style.display = "inline-flex";
      btnGravarAudio.style.background = "#e11d48";
      if (iconGravarAudio) iconGravarAudio.className = "fas fa-circle";
      if (labelGravarAudio) labelGravarAudio.textContent = "Gravar Áudio";
    }

    if (cancelar) {
      gravacaoAudioDataUrl = "";
      audioChunks = [];
      if (audioTimer) audioTimer.textContent = "00:15";
      if (audioProgressBar) audioProgressBar.style.width = "0%";
      if (btnOuvirAudio) btnOuvirAudio.style.display = "none";
      if (btnDescartarAudio) btnDescartarAudio.style.display = "none";
      if (audioGravadoStatus) audioGravadoStatus.textContent = "";
      if (audioPreviewPlayer) {
        audioPreviewPlayer.pause();
        audioPreviewPlayer = null;
      }
    }
  }

  // Botão Principal de Adicionar (+) - Abre o Modal Completo de Vibes
  const btnAbrirSeletor = document.querySelector(".btn-abrir-seletor");
  if (btnAbrirSeletor) {
    btnAbrirSeletor.addEventListener("click", () => {
      abrirModalPostarVibe("geral", () => {
        console.log("Vibe postada com sucesso pelo modal no Feed!");
      });
    });
  }

  // Controle das abas de tipo de mídia
  if (abasTipo && abasTipo.length > 0) {
    abasTipo.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tipo = btn.getAttribute("data-tipo");
        tipoSelecionado = tipo;

        // Atualiza destaque visual das abas
        abasTipo.forEach((b) => {
          b.style.borderColor = "rgba(255, 255, 255, 0.05)";
          b.style.boxShadow = "none";
        });
        btn.style.borderColor = "var(--ciano-neon)";
        btn.style.boxShadow = "0 0 10px rgba(0, 240, 255, 0.2)";

        if (containerSeletorFoto) {
          containerSeletorFoto.style.display = tipo === "foto" ? "flex" : "none";
        }
        if (containerPreviewFoto) {
          containerPreviewFoto.style.display = tipo === "foto" && arquivoFotoUrl ? "block" : "none";
        }
        if (containerGravadorAudio) {
          containerGravadorAudio.style.display = tipo === "musica" ? "flex" : "none";
        }

        if (inputVibeDado) {
          inputVibeDado.disabled = false;
          if (tipo === "foto") {
            inputVibeDado.placeholder = arquivoFotoUrl ? "Foto pronta para lançar!" : "Selecione uma foto da Galeria ou tire uma Selfie...";
          } else if (tipo === "texto") {
            inputVibeDado.placeholder = "Escreva sua mensagem neon para a Tribo...";
            inputVibeDado.focus();
          } else if (tipo === "musica") {
            inputVibeDado.placeholder = gravacaoAudioDataUrl ? "🎙️ Áudio de 15s gravado e pronto para o Mural!" : "Grave um áudio de até 15s abaixo ou digite o nome da música...";
          }
        }
      });
    });
  }

  // Função central para processar foto da galeria ou selfie tirada com a câmera
  async function processarArquivoFoto(file) {
    if (!file) return;
    try {
      arquivoFotoUrl = await fazerUploadDeFoto(file);
      if (imgPreviewFoto) {
        imgPreviewFoto.src = arquivoFotoUrl;
      }
      if (containerPreviewFoto) {
        containerPreviewFoto.style.display = "block";
      }
      if (inputVibeDado) {
        inputVibeDado.value = `📸 Imagem pronta: ${file.name || "Foto / Selfie"}`;
      }
    } catch (err) {
      console.error("Erro ao carregar foto:", err);
      alert("⚠️ Erro ao carregar arquivo de foto.");
    }
  }

  // Disparo ao abrir a Galeria (Celular ou PC)
  if (btnAbrirGaleria) {
    btnAbrirGaleria.addEventListener("click", () => {
      if (fileGaleria) fileGaleria.click();
      else if (fileUpload) fileUpload.click();
    });
  }

  // Disparo para abrir a Câmera nativa / Selfie (Celular)
  if (btnAbrirCamera) {
    btnAbrirCamera.addEventListener("click", () => {
      if (fileCamera) fileCamera.click();
      else if (fileUpload) fileUpload.click();
    });
  }

  // Listener para input da galeria
  if (fileGaleria) {
    fileGaleria.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      processarArquivoFoto(file);
    });
  }

  // Listener para input da câmera / selfie
  if (fileCamera) {
    fileCamera.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      processarArquivoFoto(file);
    });
  }

  // Upload legado como fallback
  if (fileUpload) {
    fileUpload.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      processarArquivoFoto(file);
    });
  }

  // Botão para remover a foto selecionada
  if (btnRemoverFoto) {
    btnRemoverFoto.addEventListener("click", () => {
      arquivoFotoUrl = "";
      if (imgPreviewFoto) imgPreviewFoto.src = "";
      if (containerPreviewFoto) containerPreviewFoto.style.display = "none";
      if (inputVibeDado) inputVibeDado.value = "";
      if (fileGaleria) fileGaleria.value = "";
      if (fileCamera) fileCamera.value = "";
      if (fileUpload) fileUpload.value = "";
    });
  }

  // Configuração do Botão de Iniciar Gravação de Áudio (15s) via Web MediaRecorder
  if (btnGravarAudio) {
    btnGravarAudio.addEventListener("click", async () => {
      if (isGravando) {
        pararGravacaoAudio(false);
        return;
      }

      // Solicita permissão e habilita acesso ao microfone
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(audioStream);
        audioChunks = [];
        tempoRestante = 15;
        isGravando = true;

        if (btnGravarAudio) btnGravarAudio.style.display = "none";
        if (btnStopAudio) btnStopAudio.style.display = "inline-flex";
        if (btnOuvirAudio) btnOuvirAudio.style.display = "none";
        if (btnDescartarAudio) btnDescartarAudio.style.display = "none";
        if (audioGravadoStatus) audioGravadoStatus.textContent = "Gravando microfone (máx. 15s)...";

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Finaliza e converte o stream gravado em um Blob binário de áudio
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          try {
            // Converte e prepara para envio ao Firebase Storage
            gravacaoAudioDataUrl = await fazerUploadDeAudio(audioBlob);
            if (inputVibeDado) {
              inputVibeDado.value = "🎙️ Áudio da Trilha Gravado (15s)";
            }
            if (btnOuvirAudio) btnOuvirAudio.style.display = "inline-flex";
            if (btnDescartarAudio) btnDescartarAudio.style.display = "inline-flex";
            if (audioGravadoStatus) audioGravadoStatus.textContent = "Stream convertido em Blob e pronto para o Firebase Storage!";
          } catch (err) {
            console.error("Erro ao converter áudio em Blob:", err);
            if (audioGravadoStatus) audioGravadoStatus.textContent = "Erro ao processar stream de áudio.";
          }
        };

        mediaRecorder.start();

        // Cronômetro regressivo de 15 segundos
        if (audioTimer) audioTimer.textContent = "00:15";
        if (audioProgressBar) audioProgressBar.style.width = "0%";

        gravacaoTimerInterval = setInterval(() => {
          tempoRestante--;
          const progresso = ((15 - tempoRestante) / 15) * 100;
          if (audioProgressBar) audioProgressBar.style.width = `${progresso}%`;
          if (audioTimer) {
            audioTimer.textContent = `00:${tempoRestante < 10 ? "0" + tempoRestante : tempoRestante}`;
          }

          if (tempoRestante <= 0) {
            pararGravacaoAudio(false);
          }
        }, 1000);

      } catch (err) {
        console.error("Erro ao acessar microfone:", err);
        alert("⚠️ Não foi possível acessar o microfone. Verifique as permissões do seu navegador.");
      }
    });
  }

  // Botão explícito de Stop para finalizar e converter o stream em Blob
  if (btnStopAudio) {
    btnStopAudio.addEventListener("click", () => {
      pararGravacaoAudio(false);
    });
  }

  // Ouvir prévia do áudio gravado
  if (btnOuvirAudio) {
    btnOuvirAudio.addEventListener("click", () => {
      if (!gravacaoAudioDataUrl) return;

      if (audioPreviewPlayer && !audioPreviewPlayer.paused) {
        audioPreviewPlayer.pause();
        if (iconOuvirAudio) iconOuvirAudio.className = "fas fa-play";
        if (labelOuvirAudio) labelOuvirAudio.textContent = "Ouvir Prévia";
      } else {
        audioPreviewPlayer = new Audio(gravacaoAudioDataUrl);
        if (iconOuvirAudio) iconOuvirAudio.className = "fas fa-pause";
        if (labelOuvirAudio) labelOuvirAudio.textContent = "Pausar";

        audioPreviewPlayer.onended = () => {
          if (iconOuvirAudio) iconOuvirAudio.className = "fas fa-play";
          if (labelOuvirAudio) labelOuvirAudio.textContent = "Ouvir Prévia";
        };

        audioPreviewPlayer.play().catch((e) => console.warn("Erro ao reproduzir prévia:", e));
      }
    });
  }

  // Descartar áudio gravado
  if (btnDescartarAudio) {
    btnDescartarAudio.addEventListener("click", () => {
      pararGravacaoAudio(true);
      if (inputVibeDado) inputVibeDado.value = "";
    });
  }

  // Disparo da Vibe no Mural
  if (btnDispararVibe) {
    btnDispararVibe.addEventListener("click", async () => {
      let dadoConteudo = "";
      if (tipoSelecionado === "foto") {
        // Usa estritamente a URL/base64 da foto processada
        dadoConteudo = arquivoFotoUrl || "";
        if (!dadoConteudo && inputVibeDado?.value?.trim() && (inputVibeDado.value.startsWith("http") || inputVibeDado.value.startsWith("data:image"))) {
          dadoConteudo = inputVibeDado.value.trim();
        }
        if (!dadoConteudo) {
          const urlManual = prompt("🪐 Insira o link da foto ou selecione um arquivo:");
          if (urlManual && urlManual.trim()) dadoConteudo = urlManual.trim();
        }
      } else if (tipoSelecionado === "musica") {
        dadoConteudo = gravacaoAudioDataUrl || inputVibeDado?.value?.trim() || "";
      } else {
        dadoConteudo = inputVibeDado?.value?.trim() || "";
      }

      if (!dadoConteudo) {
        alert("⚠️ Por favor, grave um áudio de até 15s ou escolha um conteúdo para a sua Vibe!");
        return;
      }

      btnDispararVibe.disabled = true;
      btnDispararVibe.textContent = "Lançando...";

      try {
        const res = await lancarVibeFlexivel(usuarioAtual.uid, "geral", {
          tipo: tipoSelecionado,
          dado: dadoConteudo,
          corFundo: "#121214",
          musicaId: tipoSelecionado === "musica" ? dadoConteudo : null,
          autor_nome: usuarioAtual.nome || auth?.currentUser?.displayName || "Membro da Tribo",
          autor_avatar: usuarioAtual.avatar_url || usuarioAtual.avatar || ""
        });

        if (res.sucesso) {
          alert("🎉 Nova Vibe lançada no Mural com sucesso!");
          if (inputVibeDado) inputVibeDado.value = "";
          arquivoFotoUrl = "";
          if (imgPreviewFoto) imgPreviewFoto.src = "";
          if (containerPreviewFoto) containerPreviewFoto.style.display = "none";
          pararGravacaoAudio(true);
          if (fileUpload) fileUpload.value = "";
          if (fileGaleria) fileGaleria.value = "";
          if (fileCamera) fileCamera.value = "";
        } else {
          alert(`Erro ao lançar vibe: ${res.erro}`);
        }
      } catch (err) {
        console.error("Erro ao enviar vibe:", err);
      } finally {
        btnDispararVibe.disabled = false;
        btnDispararVibe.textContent = "Lançar no Mural";
      }
    });
  }

  // Escuta em tempo real para exibir as bolinhas
  if (containerStories) {
    try {
      const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const storiesQuery = query(
        collection(db, "comunidades_stories"),
        orderBy("data_criacao", "desc")
      );

      onSnapshot(storiesQuery, (snap) => {
        // Remove bolinhas anteriores mantendo o botão principal
        const storiesAnteriores = containerStories.querySelectorAll(".item-vibe-renderizado");
        storiesAnteriores.forEach((el) => el.remove());

        let totalVibes = 0;

        snap.forEach((docSnap) => {
          const story = docSnap.data();
          const dataCriacao = story.data_criacao || "";
          
          // Filtra 24h
          if (dataCriacao && dataCriacao < vinteQuatroHorasAtras) return;

          totalVibes++;
          const cardStory = document.createElement("div");
          cardStory.className = "card-story-vertical item-vibe-renderizado";
          cardStory.style.cssText = "min-width: 110px; width: 110px; height: 175px; flex-shrink: 0; position: relative; border-radius: 14px; overflow: hidden; cursor: pointer; border: 1px solid var(--pink-magenta); box-shadow: 0 0 10px rgba(255, 0, 127, 0.2);";

          const tipo = story.tipo || story.tipo_conteudo || (story.media_url ? "foto" : "texto");
          const dado = story.dado_conteudo || story.media_url || "";
          const nomeAutor = escapeHTML(story.autor_nome || "Membro");
          const avatarAutor = story.autor_avatar && typeof story.autor_avatar === "string" && story.autor_avatar.startsWith("http")
            ? story.autor_avatar
            : "img/avatar-fallback.png";

          // Se for vídeo, coloca a prévia rodando em loop atrás do gradiente
          if (tipo === "video") {
              cardStory.style.background = "#000";
              cardStory.innerHTML = `
                  <video src="${escapeHTML(dado)}" autoplay muted loop playsinline style="position: absolute; width: 100%; height: 100%; object-fit: cover; z-index: 0; pointer-events: none;"></video>
                  <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%); z-index: 1;"></div>
                  <div style="position: absolute; top: 10px; left: 10px; z-index: 2; width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--ciano-neon); overflow: hidden; background: #000;">
                      <img src="${escapeHTML(avatarAutor)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='img/avatar-fallback.png';">
                  </div>
                  <span style="position: absolute; bottom: 10px; left: 10px; right: 10px; z-index: 2; font-size: 0.7rem; color: #FFFFFF; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nomeAutor}</span>
              `;
          } else if (tipo === "musica" || tipo === "audio") {
              cardStory.style.background = "linear-gradient(145deg, #180d26 0%, #FF007F 100%)";
              cardStory.innerHTML = `
                  <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1;">
                      <span style="font-size: 2.2rem; filter: drop-shadow(0 0 10px #00F0FF);">🎵</span>
                  </div>
                  <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%); z-index: 1;"></div>
                  <div style="position: absolute; top: 10px; left: 10px; z-index: 2; width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--ciano-neon); overflow: hidden; background: #000;">
                      <img src="${escapeHTML(avatarAutor)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='img/avatar-fallback.png';">
                  </div>
                  <span style="position: absolute; bottom: 10px; left: 10px; right: 10px; z-index: 2; font-size: 0.7rem; color: #FFFFFF; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nomeAutor}</span>
              `;
          } else if (tipo === "texto") {
              const corFundo = story.cor_fundo_neon || "#121214";
              cardStory.style.background = corFundo;
              cardStory.innerHTML = `
                  <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 10px; z-index: 1; text-align: center;">
                      <p style="font-size: 0.75rem; font-weight: 600; color: #FFF; line-height: 1.3;">${escapeHTML(dado).substring(0, 50)}</p>
                  </div>
                  <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%); z-index: 1;"></div>
                  <div style="position: absolute; top: 10px; left: 10px; z-index: 2; width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--ciano-neon); overflow: hidden; background: #000;">
                      <img src="${escapeHTML(avatarAutor)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='img/avatar-fallback.png';">
                  </div>
                  <span style="position: absolute; bottom: 10px; left: 10px; right: 10px; z-index: 2; font-size: 0.7rem; color: #FFFFFF; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nomeAutor}</span>
              `;
          } else {
              // Se for imagem, aplica direto no background-image
              cardStory.style.background = `url('${dado}') center/cover no-repeat`;
              cardStory.innerHTML = `
                  <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%); z-index: 1;"></div>
                  <div style="position: absolute; top: 10px; left: 10px; z-index: 2; width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--ciano-neon); overflow: hidden; background: #000;">
                      <img src="${escapeHTML(avatarAutor)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='img/avatar-fallback.png';">
                  </div>
                  <span style="position: absolute; bottom: 10px; left: 10px; right: 10px; z-index: 2; font-size: 0.7rem; color: #FFFFFF; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nomeAutor}</span>
              `;
          }

          cardStory.onclick = () => {
            abrirVisualizadorStory({
              id: docSnap.id,
              autorId: story.autor_id || "",
              tipo,
              dado,
              autorNome: story.autor_nome || "Membro da Tribo",
              autorAvatar: story.autor_avatar || "👤",
              tempo: story.data_criacao ? new Date(story.data_criacao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Vibe de 24h",
              corFundo: story.cor_fundo_neon || "#121214",
              usuarioAtualId: usuarioAtual.uid
            });
          };

          containerStories.appendChild(cardStory);
        });

        if (txtSemVibes) {
          txtSemVibes.style.display = totalVibes > 0 ? "none" : "inline";
        }
      }, (err) => {
        console.warn("[Feed] Stories snapshot:", err);
      });
    } catch (e) {
      console.warn("[Feed] Erro ao carregar stories:", e);
    }
  }

  // 3. CAIXA DE POSTAGEM DO FEED
  const txtVibe = document.getElementById("input-vibe");
  const btnPostar = document.getElementById("btn-postar");

  if (txtVibe && btnPostar) {
    btnPostar.onclick = async () => {
      const texto = txtVibe.value.trim();
      if (!texto) {
        txtVibe.focus();
        return;
      }

      btnPostar.disabled = true;
      btnPostar.textContent = "Postando...";

      try {
        await postarMicroVibe(usuarioAtual.uid, usuarioAtual.nome, texto);
        txtVibe.value = "";
      } catch (e) {
        console.error("Erro ao postar micro-vibe:", e);
        alert("Erro ao publicar vibe: " + e.message);
      } finally {
        btnPostar.disabled = false;
        btnPostar.textContent = "Postar";
      }
    };
  }

  // 4. LISTA DO FEED CRONOLÓGICO EM TEMPO REAL
  const feedContainer = document.getElementById("feed-dinamico-container");
  if (feedContainer) {
    escutarFeedTempoReal((posts) => {
      if (!posts || posts.length === 0) {
        feedContainer.innerHTML = `
          <p style="text-align: center; color: var(--texto-suave); font-size: 0.9rem; margin-top: 20px;">
            Nenhum micro-vibe compartilhado ainda. Seja o primeiro! 🪐
          </p>
        `;
        return;
      }

      feedContainer.innerHTML = "";

      posts.forEach((post) => {
        const nomeAutor = post.autor_name || post.autor_nome || "Membro Vibe";
        const textoPost = post.conteudo_texto || post.texto || "";
        const curtidas = post.curtidas_contador ?? post.curtidas ?? 0;
        const comentariosCount = post.comentarios_contador ?? post.comentarios ?? 0;

        const isAutor = usuarioAtual.uid && (post.autor_id === usuarioAtual.uid || post.autor_id === "user_anonimo");
        const btnExcluirHTML = isAutor ? `
          <!-- 🗑️ BOTÃO DA LIXEIRA SUPREMA CYBERPUNK -->
          <button class="btn-deletar-vibe btn-excluir-post" data-id="${post.id}" data-post-id="${post.id}" title="Eliminar da órbita" style="background: none; border: none; color: var(--pink-magenta, #FF007F); cursor: pointer; font-size: 0.95rem; padding: 6px; opacity: 0.7; transition: all 0.2s ease; margin-left: auto; filter: drop-shadow(0 0 3px var(--pink-magenta));" onmouseover="this.style.opacity='1'; this.style.transform='scale(1.15)';" onmouseout="this.style.opacity='0.7'; this.style.transform='scale(1)';">
              <i class="fas fa-trash-alt"></i>
          </button>
        ` : "";

        const tempoFormatado = calcularTempoTranscorrido(post.data_criacao || post.timestamp || post.data_postagem);

        const autorUID = post.autor_id || post.autor_uid || "";
        const card = document.createElement("div");
        card.className = "card-vibe card-feed";
        card.setAttribute("data-id", post.id);
        card.innerHTML = `
          <div class="feed-header" style="display: flex; justify-content: space-between; align-items: center;">
              <div class="usuario-info btn-visitar-perfil" data-autor-uid="${autorUID}" style="cursor: pointer; display: flex; align-items: center; gap: 10px;">
                  <div class="avatar-m">🤠</div>
                  <div>
                      <h4 style="font-size: 0.95rem; font-weight: 600; transition: color 0.2s;" onmouseover="this.style.color='var(--ciano-neon)';" onmouseout="this.style.color='';">${escapeHTML(nomeAutor)}</h4>
                      <span style="font-size: 0.75rem; color: var(--texto-suave);">${tempoFormatado}</span>
                  </div>
              </div>
              ${btnExcluirHTML}
          </div>
          <div class="feed-conteudo">
              <p>${escapeHTML(textoPost)}</p>
          </div>
          <div class="feed-footer">
              <button class="acao-feed btn-curtir" style="background: none; border: none; color: var(--texto-suave); cursor: pointer; display: flex; align-items: center; gap: 6px;">
                  <i class="fas fa-heart"></i> <span class="curtidas-num">${curtidas}</span>
              </button>
              <button class="acao-feed btn-comentar-gaveta" data-post-id="${post.id}" style="background: none; border: none; color: var(--texto-suave); cursor: pointer; display: flex; align-items: center; gap: 6px;">
                  <i class="fas fa-comment"></i> <span class="comentarios-num">${comentariosCount}</span>
              </button>
          </div>
          <div class="feed-comentarios-gaveta" id="gaveta-post-${post.id}" style="display: none; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 10px;">
              <div class="lista-respostas-inner" style="max-height: 150px; overflow-y: auto; margin-bottom: 8px;"></div>
              <div style="display: flex; gap: 6px;">
                  <input type="text" class="input-resp-vibe" placeholder="Responder micro-vibe..." style="flex: 1; background: var(--cinza-input); color: #FFF; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 10px; font-size: 0.85rem;" />
                  <button class="btn-enviar-resp-vibe" data-post-id="${post.id}" style="background: var(--gradient-supremo); color: #FFF; border: none; border-radius: 8px; padding: 6px 14px; font-weight: bold; font-size: 0.8rem; cursor: pointer;">Enviar</button>
              </div>
          </div>
        `;

        // Ativador do redirecionamento dinâmico para a página de perfil
        const btnPerfil = card.querySelector(".btn-visitar-perfil");
        if (btnPerfil) {
            btnPerfil.onclick = () => {
                const targetUID = btnPerfil.getAttribute("data-autor-uid");
                if (targetUID) {
                    console.log(`Navegando para a órbita do usuário: ${targetUID}`);
                    window.location.href = `perfil.html?id=${targetUID}`;
                }
            };
        }

        // Ativação das interações do card (trava antiauto-curtida e escuta onSnapshot dos comentários)
        configurarInteracoesDoCard(card, post, usuarioAtual);

        const btnEnviarResp = card.querySelector(".btn-enviar-resp-vibe");
        const inputResp = card.querySelector(".input-resp-vibe");
        if (btnEnviarResp && inputResp) {
            btnEnviarResp.onclick = async () => {
              const txt = inputResp.value.trim();
              if (!txt) return;
              inputResp.value = "";
              await enviarComentarioPost(post.id, usuarioAtual.uid, usuarioAtual.nome, txt);
            };
        }

        // Handler de exclusão do post
        const btnExcluir = card.querySelector(".btn-excluir-post");
        if (btnExcluir) {
          btnExcluir.onclick = async () => {
            const confirmar = confirm("Tem certeza de que deseja excluir esta postagem?");
            if (!confirmar) return;

            btnExcluir.disabled = true;
            btnExcluir.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
            try {
              if (db && post.id) {
                await deleteDoc(doc(db, "feed_posts", post.id));
              }
              card.remove();
            } catch (err) {
              console.error("Erro ao excluir postagem:", err);
              alert("Não foi possível excluir a postagem: " + err.message);
              btnExcluir.disabled = false;
              btnExcluir.innerHTML = `<i class="fas fa-trash-alt"></i>`;
            }
          };
        }

        feedContainer.appendChild(card);
      });
    });
  }

  // 5. PRÓXIMOS ROLÊS (EVENTOS REAIS)
  const listaEventos = document.getElementById("lista-eventos-realtime");
  if (listaEventos) {
    try {
      const evQuery = query(collection(db, "eventos"), orderBy("data_criacao", "desc"));
      onSnapshot(evQuery, (snap) => {
        if (snap.empty) {
          listaEventos.innerHTML = `
            <p style="font-size: 0.8rem; color: var(--texto-suave); font-style: italic;">
              Nenhum rolê marcado na sua comu por enquanto.
            </p>
          `;
          return;
        }

        listaEventos.innerHTML = "";
        snap.forEach((d) => {
          const ev = d.data();
          const itemEv = document.createElement("div");
          itemEv.style.background = "var(--cinza-input)";
          itemEv.style.padding = "10px";
          itemEv.style.borderRadius = "12px";
          itemEv.style.border = "1px solid rgba(255,255,255,0.03)";
          itemEv.innerHTML = `
            <h4 style="font-size: 0.85rem; color: var(--ciano-neon); margin-bottom: 4px;">${escapeHTML(ev.titulo || 'Rolê da Tribo')}</h4>
            <div style="font-size: 0.75rem; color: var(--texto-suave); display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px;">
              <span>📍 ${escapeHTML(ev.local || 'Online')}</span>
              <span>📅 ${escapeHTML(ev.data_hora || 'Em breve')}</span>
              <span style="color: var(--pink-magenta); font-weight: bold; margin-top: 4px;" id="contador-presenca-${d.id}">🔥 ${ev.confirmados?.length || 0} confirmados</span>
            </div>
            
            <!-- 🚀 BOTÃO DE COLAR NO ROLÊ -->
            <button class="btn-colar-role" data-evento-id="${d.id}" style="width: 100%; background: rgba(0, 240, 255, 0.1); color: var(--ciano-neon); border: 1px solid var(--ciano-neon); padding: 5px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                Vou colar! 🚀
            </button>
          `;

          // Lógica de clique para confirmar presença
          const botoesColar = itemEv.querySelectorAll(".btn-colar-role");
          botoesColar.forEach((btn) => {
              // Se já estiver confirmado pelo usuário atual, mostra estado verde
              const usuarioAtual = auth?.currentUser;
              if (usuarioAtual && Array.isArray(ev.confirmados) && ev.confirmados.includes(usuarioAtual.uid)) {
                  btn.innerText = "Presença Confirmada! ✓";
                  btn.style.borderColor = "#00FF00";
                  btn.style.color = "#00FF00";
                  btn.style.background = "rgba(0, 255, 0, 0.05)";
              }

              btn.onclick = async () => {
                  const evId = btn.getAttribute("data-evento-id");
                  const meuUID = auth?.currentUser?.uid;

                  if (!meuUID) return;

                  btn.disabled = true;
                  btn.innerText = "⏳ Confirmando...";

                  try {
                      const evRef = doc(db, "eventos", evId);
                      
                      // Adiciona o UID do usuário na lista sem duplicar
                      await updateDoc(evRef, {
                          confirmados: arrayUnion(meuUID)
                      });

                      btn.innerText = "Presença Confirmada! ✓";
                      btn.style.borderColor = "#00FF00";
                      btn.style.color = "#00FF00";
                      btn.style.background = "rgba(0, 255, 0, 0.05)";
                  } catch (err) {
                      console.error("Erro ao confirmar presença no rolê:", err);
                      btn.disabled = false;
                      btn.innerText = "Vou colar! 🚀";
                  }
              };
          });

          listaEventos.appendChild(itemEv);
        });
      }, (e) => {
        console.warn("[Feed] Erro ao carregar eventos:", e);
      });
    } catch (e) {
      console.warn("[Feed] Eventos listener:", e);
    }
  }

  // 🪐 8. ENCANAMENTO DO SININHO CYBERPUNK (ABRIR/FECHAR GAVETA DE NOTIFICAÇÕES)
  const wrapperSininho = document.querySelector(".nav-notificacoes-wrapper");
  const gavetaSininho = document.getElementById("gaveta-sininho-lista");

  if (wrapperSininho && gavetaSininho) {
    wrapperSininho.addEventListener("click", (e) => {
      e.stopPropagation();
      const aberto = gavetaSininho.style.display === "block";
      gavetaSininho.style.display = aberto ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
      if (gavetaSininho && !wrapperSininho.contains(e.target)) {
        gavetaSininho.style.display = "none";
      }
    });
  }
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Inicializa no carregamento do DOM
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarFeedPage);
  } else {
    iniciarFeedPage();
  }
}

export default iniciarFeedPage;
