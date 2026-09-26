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
  increment, 
  getDoc,
  serverTimestamp 
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

export function iniciarFeedPage() {
  console.log("🪐 [Tribbu'sVibe] Inicializando Feed Central...");

  let usuarioAtual = {
    uid: "user_anonimo",
    nome: "Membro Vibe",
    avatar: "👤",
    status: "Na vibe antialgoritmo ✨"
  };

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
        const userDocSnap = await getDoc(doc(db, "usuarios", user.uid));
        if (userDocSnap.exists()) {
          const dados = userDocSnap.data();
          usuarioAtual.nome = dados.nome || usuarioAtual.nome;
          usuarioAtual.avatar = dados.avatar_emoji || dados.avatar || "🤠";
          usuarioAtual.status = dados.frase_status || dados.recado || "Conectando pessoas de verdade 🪐";
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

    if (lblAvatar) lblAvatar.textContent = usuarioAtual.avatar;
    if (lblNome) lblNome.textContent = usuarioAtual.nome;
    if (lblStatus) lblStatus.textContent = usuarioAtual.status;

    // Termômetros com animação suave
    if (barraConfiavel) barraConfiavel.style.width = "92%";
    if (barraLegal) barraLegal.style.width = "96%";
    if (barraVibe) barraVibe.style.width = "100%";
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

  // Inicializa exibição padrão (aba Foto selecionada)
  if (containerSeletorFoto) {
    containerSeletorFoto.style.display = "flex";
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

  // Abertura rápida pelo botão redondo '+'
  const btnAbrirSeletor = document.querySelector(".btn-abrir-seletor");
  if (btnAbrirSeletor) {
    btnAbrirSeletor.addEventListener("click", () => {
      const painel = document.getElementById("painel-vibe-abas");
      if (painel) {
        painel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (inputVibeDado) inputVibeDado.focus();
      }
    });
  }

  // Disparo da Vibe no Mural
  if (btnDispararVibe) {
    btnDispararVibe.addEventListener("click", async () => {
      let dadoConteudo = "";
      if (tipoSelecionado === "foto") {
        dadoConteudo = arquivoFotoUrl || inputVibeDado?.value?.trim() || "";
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
          const storyDiv = document.createElement("div");
          storyDiv.className = "circle-story item-vibe-renderizado";
          storyDiv.style.width = "65px";
          storyDiv.style.height = "65px";
          storyDiv.style.borderRadius = "50%";
          storyDiv.style.display = "flex";
          storyDiv.style.flexDirection = "column";
          storyDiv.style.justifyContent = "center";
          storyDiv.style.alignItems = "center";
          storyDiv.style.cursor = "pointer";
          storyDiv.style.flexShrink = "0";
          storyDiv.style.border = "2px solid var(--pink-magenta)";
          storyDiv.style.boxShadow = "0 0 10px rgba(255, 0, 127, 0.3)";
          storyDiv.style.backgroundSize = "cover";
          storyDiv.style.backgroundPosition = "center";
          storyDiv.style.transition = "transform 0.2s";

          const tipo = story.tipo_conteudo || (story.media_url ? "foto" : "texto");
          const dado = story.dado_conteudo || story.media_url || "";

          if (tipo === "foto" && dado && (dado.startsWith("http") || dado.startsWith("data:"))) {
            storyDiv.style.backgroundImage = `url('${dado}')`;
          } else if (tipo === "texto") {
            storyDiv.style.background = story.cor_fundo_neon || "#121214";
            storyDiv.style.border = "2px solid var(--ciano-neon)";
            storyDiv.innerHTML = `<i class="fas fa-font" style="color: var(--pink-magenta); font-size: 1.2rem;"></i>`;
          } else if (tipo === "musica") {
            storyDiv.style.background = "#18181b";
            storyDiv.style.border = "2px solid #FFD700";
            const isAudioGravado = dado.startsWith("data:audio") || dado.includes("audio");
            storyDiv.innerHTML = `<i class="fas ${isAudioGravado ? "fa-microphone-lines" : "fa-music"}" style="color: #FFD700; font-size: 1.2rem;"></i>`;
            storyDiv.title = `Story de Áudio/Trilha Sonora de ${story.autor_id || "Membro"} (Clique para ouvir)`;
          } else {
            storyDiv.innerHTML = `✨`;
          }

          storyDiv.onclick = () => {
            if (tipo === "foto" && dado.startsWith("http")) {
              window.open(dado, "_blank");
            } else if (tipo === "musica" && (dado.startsWith("data:audio") || dado.startsWith("http"))) {
              // Tocar áudio capturado
              if (storyAudioAtivo) {
                storyAudioAtivo.pause();
                storyAudioAtivo = null;
                storyDiv.style.transform = "scale(1)";
              }
              const player = new Audio(dado);
              storyAudioAtivo = player;
              storyDiv.style.transform = "scale(1.15)";
              storyDiv.style.borderColor = "#00F0FF";
              player.onended = () => {
                storyDiv.style.transform = "scale(1)";
                storyDiv.style.borderColor = "#FFD700";
                storyAudioAtivo = null;
              };
              player.play().catch((err) => {
                console.warn("Erro ao reproduzir áudio do story:", err);
                alert(`🪐 Trilha sonora: ${dado}`);
              });
            } else {
              alert(`🪐 Vibe da Tribo:\n[${tipo.toUpperCase()}]: ${dado}`);
            }
          };

          containerStories.appendChild(storyDiv);
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

        const card = document.createElement("div");
        card.className = "card-vibe card-feed";
        card.setAttribute("data-id", post.id);
        card.innerHTML = `
          <div class="feed-header">
              <div class="usuario-info">
                  <div class="avatar-m">🤠</div>
                  <div>
                      <h4 style="font-size: 0.95rem; font-weight: 600;">${escapeHTML(nomeAutor)}</h4>
                      <span style="font-size: 0.75rem; color: var(--texto-suave);">agora há pouco</span>
                  </div>
              </div>
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

        // Like handler
        const btnCurtir = card.querySelector(".btn-curtir");
        btnCurtir.onclick = async () => {
          btnCurtir.style.color = "var(--pink-magenta)";
          try {
            const pRef = doc(db, "feed_posts", post.id);
            await updateDoc(pRef, { curtidas_contador: increment(1) });
          } catch (err) {
            console.error("Erro ao curtir:", err);
          }
        };

        // Comentários gaveta
        const btnComentar = card.querySelector(".btn-comentar-gaveta");
        const gaveta = card.querySelector(`#gaveta-post-${post.id}`);
        const listaInner = card.querySelector(".lista-respostas-inner");
        let escutaAtiva = false;

        btnComentar.onclick = () => {
          const aberta = gaveta.style.display === "block";
          gaveta.style.display = aberta ? "none" : "block";

          if (!aberta && !escutaAtiva) {
            escutaAtiva = true;
            escutarComentariosDoPost(post.id, (comentarios) => {
              listaInner.innerHTML = "";
              if (comentarios.length === 0) {
                listaInner.innerHTML = `<div style="font-size: 0.75rem; color: var(--texto-suave); font-style: italic;">Seja o primeiro a responder! ✨</div>`;
                return;
              }
              comentarios.forEach((c) => {
                const item = document.createElement("div");
                item.style.background = "var(--cinza-input)";
                item.style.padding = "6px 8px";
                item.style.borderRadius = "6px";
                item.style.marginBottom = "5px";
                item.style.borderLeft = "2px solid var(--ciano-neon)";
                item.innerHTML = `
                  <strong style="color: var(--ciano-neon); font-size: 0.75rem;">${escapeHTML(c.autor_name || 'Membro')}</strong>
                  <p style="font-size: 0.8rem; margin: 2px 0 0 0; color: #FFF;">${escapeHTML(c.conteudo_texto || '')}</p>
                `;
                listaInner.appendChild(item);
              });
            });
          }
        };

        const btnEnviarResp = card.querySelector(".btn-enviar-resp-vibe");
        const inputResp = card.querySelector(".input-resp-vibe");
        btnEnviarResp.onclick = async () => {
          const txt = inputResp.value.trim();
          if (!txt) return;
          inputResp.value = "";
          await enviarComentarioPost(post.id, usuarioAtual.uid, usuarioAtual.nome, txt);
        };

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
            <div style="font-size: 0.75rem; color: var(--texto-suave); display: flex; flex-direction: column; gap: 2px;">
              <span>📍 ${escapeHTML(ev.local || 'Online')}</span>
              <span>📅 ${escapeHTML(ev.data_hora || 'Em breve')}</span>
            </div>
          `;
          listaEventos.appendChild(itemEv);
        });
      }, (e) => {
        console.warn("[Feed] Erro ao carregar eventos:", e);
      });
    } catch (e) {
      console.warn("[Feed] Eventos listener:", e);
    }
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
