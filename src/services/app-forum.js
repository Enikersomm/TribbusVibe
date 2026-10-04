// 🪐 Tribbu'sVibe - Encanamento do Fórum da Tribo (Tempo Real)
// Arquivo: app-forum.js

import { onAuthStateChanged } from "firebase/auth";
import { auth, db, storage } from "./tribbusFirebase.js";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { redimensionarEComprimirImagem } from "./firebase-storage.js";
import { 
  obterDadosTribo, 
  escutarTopicosDaTribo, 
  lancarNovoTopico, 
  alternarParticipacaoTribo 
} from "./firebase-forum.js";
import { postarStoryComunidade, escutarStoriesAtivos } from "./firebase-stories.js";
import { enviarRespostaTopico, escutarRespostasDoTopico } from "./firebase-respostas.js";

// 🪐 Tribbu'sVibe - Trava de Visibilidade do Botão Participar
// Encanamento para embutir no loop de visualização interna da Tribu na sua pasta local

export function verificarBotaoParticipar(criadorUidDaTribu) {
    const btnParticipar = document.getElementById("btn-participar-tribu") || document.getElementById("btn-entrar-tribo") || document.querySelector(".btn-participar");
    const meuUID = auth?.currentUser?.uid || localStorage.getItem("tribbus_user_session");

    if (!btnParticipar) return;

    // 🛡️ A BARREIRA DO FUNDADOR:
    // Se o usuário logado no celular for o próprio criador da Tribu...
    if (meuUID && criadorUidDaTribu && meuUID === criadorUidDaTribu) {
        console.log("👑 Fundador na área! Ocultando botão 'Participar da Tribu' para o dono do bando.");
        btnParticipar.style.display = "none"; // O botão some para você!
    } else {
        console.log("👽 Visitante na área! Liberando botão para o membro colar na Tribu.");
        btnParticipar.style.display = "block"; // O botão aparece normal para os outros usuários!
    }
}

export function inicializarForum() {
    // Parâmetro de URL para tribo customizada se houver
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const triboId = params?.get("id") || "tribo_oficial";

    const lblNome = document.getElementById("lbl-nome-tribo");
    const lblDesc = document.getElementById("lbl-desc-tribo");
    const lblEmblema = document.getElementById("lbl-emblema-tribo");
    const imgAvatarTribu = document.getElementById("img-avatar-tribu-viva");
    const containerAvatarTribu = document.getElementById("container-avatar-tribu");
    const inputTrocarAvatarTribu = document.getElementById("input-trocar-avatar-tribu");
    const btnParticipar = document.getElementById("btn-entrar-tribo");
    const listaTodasTribos = document.getElementById("lista-todas-tribos");
    
    const txtTitulo = document.getElementById("txt-titulo-topico");
    const txtCorpo = document.getElementById("txt-corpo-topico");
    const btnLancar = document.getElementById("btn-lançar-topico");
    const containerTopicos = document.getElementById("container-topicos-forum");
    const muralStories = document.getElementById("mural-stories-tribo");

    // Elementos do Modal de Discussão
    const modalDiscussao = document.getElementById("modal-discussao-topico");
    const btnFecharModal = document.getElementById("btn-fechar-modal-discussao");
    const modalTitulo = document.getElementById("modal-topico-titulo");
    const modalAutor = document.getElementById("modal-topico-autor");
    const modalConteudo = document.getElementById("modal-topico-conteudo");
    const modalRespostasLista = document.getElementById("modal-respostas-lista");
    const txtNovaResposta = document.getElementById("txt-nova-resposta");
    const btnEnviarResposta = document.getElementById("btn-enviar-resposta");

    let usuarioAtual = null;
    let unsubscribeRespostasAtivo = null;
    let topicoAtivoId = null;

    let dadosTriboAtual = null;

    // 1. Carrega dados da Tribo Ativa
    obterDadosTribo(triboId).then((dados) => {
        if (dados) {
            dadosTriboAtual = dados;
            if (lblNome && dados.nome) lblNome.textContent = dados.nome;
            if (lblDesc && dados.descricao) lblDesc.textContent = dados.descricao;
            
            // Atualiza o avatar da Tribo Viva
            const fotoTribu = dados.capa_url || dados.foto_capa_url || "";
            if (imgAvatarTribu && fotoTribu) {
                imgAvatarTribu.src = fotoTribu;
            }
            if (lblEmblema) {
                if (fotoTribu) {
                    lblEmblema.innerHTML = `<img src="${escapeAttr(fotoTribu)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 14px;" onerror="this.parentElement.innerText='🪐';" />`;
                } else if (dados.emblema) {
                    lblEmblema.textContent = dados.emblema;
                }
            }

            // 🛡️ Inicializa a trava de segurança de troca de foto com o UID do Criador
            configurarTrocaAvatarTribu(triboId, dados.criador_uid);

            // 🛡️ Trava de visibilidade do Botão Participar (Fundador vs Visitante)
            verificarBotaoParticipar(dados.criador_uid);
        }
    });

    /**
     * 🪐 Tribbu'sVibe - Sistema de Troca de Foto de Perfil de Comunidades
     * Com trava de segurança exclusiva para o Fundador da Tribu.
     */
    function configurarTrocaAvatarTribu(tribuIdAtual, criadorUidDaTribu) {
        const container = document.querySelector(".avatar-tribu-container") || containerAvatarTribu;
        const inputArquivo = document.getElementById("input-trocar-avatar-tribu") || inputTrocarAvatarTribu;
        const imgExibicao = document.getElementById("img-avatar-tribu-viva") || imgAvatarTribu;

        if (!container || !inputArquivo || !imgExibicao) return;

        // 👆 1. Clique no quadrado abre a escolha de arquivos nativa do celular/PC
        container.onclick = (e) => {
            if (e.target === inputArquivo) return;

            const meuUID = auth?.currentUser?.uid || localStorage.getItem("tribbus_user_session");
            
            // 🛡️ TRAVA DE SEGURANÇA: Só o dono/criador da Tribu pode mudar a foto dela!
            // Para a tribo_oficial, criadorUidDaTribu pode não existir ou ser restrito
            if (criadorUidDaTribu && meuUID !== criadorUidDaTribu) {
                alert("⚠️ Ops! Apenas o Fundador oficial desta Tribu pode alterar a identidade visual dela.");
                return;
            }
            
            inputArquivo.click();
        };

        // 🔄 2. Escuta quando o usuário escolhe a nova foto
        inputArquivo.onchange = async () => {
            if (!inputArquivo.files || inputArquivo.files.length === 0) return;

            const arquivo = inputArquivo.files[0];
            imgExibicao.style.opacity = "0.5"; // Feedback visual de carregando

            try {
                console.log(`Subindo nova identidade da Tribu [${tribuIdAtual}] para o Storage...`);
                let urlDownload = "";

                try {
                    // Grava a foto na pasta de capas de tribos com o ID único da comunidade
                    const fotoRef = ref(storage, `capas_tribos/avatar_${tribuIdAtual}.png`);
                    await uploadBytes(fotoRef, arquivo);
                    urlDownload = await getDownloadURL(fotoRef);
                } catch (stErr) {
                    console.warn("[TriboAvatar] Upload direto indisponível, usando fallback:", stErr);
                    urlDownload = await redimensionarEComprimirImagem(arquivo, 1080, 0.72);
                }

                if (urlDownload) {
                    // Atualiza no Firestore se não for a oficial estática
                    if (tribuIdAtual !== "tribo_oficial" && db) {
                        const tribuRef = doc(db, "tribos", tribuIdAtual);
                        await updateDoc(tribuRef, {
                            capa_url: urlDownload
                        }).catch(() => {});

                        // Espelha também em comunidades
                        await setDoc(doc(db, "comunidades", tribuIdAtual), {
                            capa_url: urlDownload
                        }, { merge: true }).catch(() => {});
                    }

                    // Atualiza a imagem na tela na mesma hora sem precisar dar F5
                    imgExibicao.src = urlDownload;
                    alert("🎉 Sucesso! A identidade visual da sua Tribu foi atualizada no universo.");
                }

            } catch (error) {
                console.error("Erro ao trocar foto da Tribu:", error);
                alert("⚠️ Não foi possível atualizar a foto da Tribu no momento.");
            } finally {
                imgExibicao.style.opacity = "1";
                inputArquivo.value = "";
            }
        };
    }

    // 🪐 1.1 Explorador: Escuta e lista todas as Tribos criadas no Firebase
    if (listaTodasTribos && db) {
        try {
            const qTribos = query(collection(db, "tribos"), orderBy("data_criacao", "desc"));
            onSnapshot(qTribos, (snap) => {
                let htmlTribos = `
                    <div onclick="window.location.href='tribos.html'" style="display: flex; align-items: center; gap: 8px; background: ${triboId === 'tribo_oficial' ? 'rgba(0, 240, 255, 0.2)' : 'var(--cinza-input)'}; border: 1px solid ${triboId === 'tribo_oficial' ? 'var(--ciano-neon)' : 'rgba(255,255,255,0.06)'}; padding: 8px 14px; border-radius: 12px; cursor: pointer; flex-shrink: 0;">
                        <span style="font-size: 1.2rem;">🪐</span>
                        <div>
                            <strong style="font-size: 0.82rem; color: #FFF; display: block;">Tribbu's Oficial</strong>
                            <small style="font-size: 0.7rem; color: var(--texto-suave);">Comunidade Raiz</small>
                        </div>
                    </div>
                `;

                snap.forEach((docSnap) => {
                    const t = docSnap.data();
                    const isAtiva = triboId === docSnap.id;
                    const capa = t.capa_url ? `<img src="${escapeAttr(t.capa_url)}" style="width: 28px; height: 28px; border-radius: 6px; object-fit: cover;" onerror="this.parentElement.innerHTML='🪐';" />` : `<span style="font-size: 1.1rem;">🪐</span>`;

                    htmlTribos += `
                        <div onclick="window.location.href='tribos.html?id=${docSnap.id}'" style="display: flex; align-items: center; gap: 8px; background: ${isAtiva ? 'rgba(255, 0, 127, 0.2)' : 'var(--cinza-input)'}; border: 1px solid ${isAtiva ? 'var(--pink-magenta)' : 'rgba(255,255,255,0.06)'}; padding: 8px 14px; border-radius: 12px; cursor: pointer; flex-shrink: 0; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.03)';" onmouseout="this.style.transform='scale(1)';">
                            <div style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px;">
                                ${capa}
                            </div>
                            <div>
                                <strong style="font-size: 0.82rem; color: #FFF; display: block; max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(t.nome || "Tribbu")}</strong>
                                <small style="font-size: 0.7rem; color: var(--texto-suave);">${t.membros_contador || 1} membros</small>
                            </div>
                        </div>
                    `;
                });

                listaTodasTribos.innerHTML = htmlTribos;
            }, (err) => {
                console.warn("[Tribos] Erro ao listar tribos:", err);
            });
        } catch (e) {
            console.warn("[Tribos] Falha ao conectar explorador:", e);
        }
    }

    function fecharModal() {
        if (modalDiscussao) modalDiscussao.style.display = "none";
        if (unsubscribeRespostasAtivo) {
            unsubscribeRespostasAtivo();
            unsubscribeRespostasAtivo = null;
        }
        topicoAtivoId = null;
    }

    if (btnFecharModal) {
        btnFecharModal.onclick = fecharModal;
    }
    if (modalDiscussao) {
        modalDiscussao.onclick = (e) => {
            if (e.target === modalDiscussao) fecharModal();
        };
    }

    function abrirTopico(topico) {
        if (!modalDiscussao) return;
        topicoAtivoId = topico.id;

        const titulo = topico.titulo_topico || topico.titulo || "Discussão";
        const autor = topico.autor_name || topico.autor_nome || "@membro";
        const corpo = topico.conteudo_inicial || topico.corpo || "(Sem mensagem inicial)";
        const tempo = formatarTempo(topico.data_criacao);

        if (modalTitulo) modalTitulo.textContent = titulo;
        if (modalAutor) modalAutor.textContent = `Por ${autor} • ${tempo}`;
        if (modalConteudo) modalConteudo.textContent = corpo;
        if (txtNovaResposta) txtNovaResposta.value = "";

        modalDiscussao.style.display = "flex";

        if (unsubscribeRespostasAtivo) unsubscribeRespostasAtivo();

        if (modalRespostasLista) {
            modalRespostasLista.innerHTML = `<div style="color:var(--texto-suave); font-size:0.85rem; text-align:center; padding:15px;">Carregando respostas em tempo real...</div>`;
        }

        unsubscribeRespostasAtivo = escutarRespostasDoTopico(topico.id, (respostas) => {
            if (!modalRespostasLista) return;
            if (!respostas || respostas.length === 0) {
                modalRespostasLista.innerHTML = `<div style="color:var(--texto-suave); font-size:0.85rem; text-align:center; padding:20px;">Nenhuma resposta ainda. Seja o primeiro a debater! 💬</div>`;
                return;
            }

            modalRespostasLista.innerHTML = respostas.map((r) => {
                const tempoResp = formatarTempo(r.data_envio);
                return `
                    <div style="background:var(--cinza-input); padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.03);">
                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--texto-suave); margin-bottom:4px;">
                            <strong style="color:#00BFFF;">${escapeHTML(r.autor_name || "@membro")}</strong>
                            <span>${tempoResp}</span>
                        </div>
                        <div style="font-size:0.9rem; color:#FFFFFF;">${escapeHTML(r.conteudo_texto || "")}</div>
                    </div>
                `;
            }).join("");

            modalRespostasLista.scrollTop = modalRespostasLista.scrollHeight;
        });
    }

    // 2. Escuta tópicos em tempo real
    if (containerTopicos) {
        escutarTopicosDaTribo(triboId, (topicos) => {
            if (!topicos || topicos.length === 0) {
                containerTopicos.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: #A5A2B8; font-style: italic; background: var(--cinza-input); border-radius: 16px;">
                        Nenhum tópico aberto ainda nesta Tribo. Seja o pioneiro e lance o primeiro debate acima! 🚀
                    </div>
                `;
                return;
            }

            containerTopicos.innerHTML = topicos.map((topico) => {
                const tempoRelativo = formatarTempo(topico.data_criacao);
                const titulo = topico.titulo_topico || topico.titulo || "Discussão sem título";
                const autor = topico.autor_name || topico.autor_nome || "@membro";
                const respostas = topico.respostas_contador ?? topico.respostas_count ?? 0;
                const corpo = topico.conteudo_inicial || topico.corpo || "";

                return `
                    <div class="topico-linha" data-id="${topico.id}" title="Clique para abrir e debater!">
                        <div class="topico-info">
                            <h4>${escapeHTML(titulo)}</h4>
                            <span>Criado por ${escapeHTML(autor)} • ${tempoRelativo}</span>
                        </div>
                        <div class="topico-stats">${respostas} respostas 💬</div>
                    </div>
                `;
            }).join("");

            // Adiciona ouvinte de clique nas linhas do fórum
            const linhas = containerTopicos.querySelectorAll(".topico-linha");
            linhas.forEach((linha) => {
                linha.addEventListener("click", () => {
                    const id = linha.getAttribute("data-id");
                    const topico = topicos.find(t => t.id === id);
                    if (topico) abrirTopico(topico);
                });
            });
        });
    }

    // 3. Monitor de Autenticação
    const unsubscribeAuth = onAuthStateChanged(auth, (usuario) => {
        usuarioAtual = usuario;
        const meuUID = usuario?.uid || "convidado_" + Date.now();
        const meuNome = usuario?.displayName || usuario?.email?.split("@")[0] || "Membro da Tribo";

        // Verifica a barreira do criador da tribo com base no usuário logado
        if (dadosTriboAtual?.criador_uid) {
            verificarBotaoParticipar(dadosTriboAtual.criador_uid);
        }

        // Lançar Tópico
        if (btnLancar && txtTitulo) {
            btnLancar.onclick = async (e) => {
                if (e) e.preventDefault();
                const titulo = txtTitulo.value.trim();
                const corpo = txtCorpo ? txtCorpo.value.trim() : "";

                if (!titulo) {
                    alert("Digite o título da sua discussão antes de lançar! ✍️");
                    txtTitulo.focus();
                    return;
                }

                btnLancar.disabled = true;
                btnLancar.textContent = "Lançando...";

                const autorFormatado = `@${meuNome.toLowerCase().replace(/\s+/g, '_')}`;
                const res = await lancarNovoTopico(triboId, meuUID, autorFormatado, titulo, corpo);

                btnLancar.disabled = false;
                btnLancar.textContent = "Lançar Tópico";

                if (res && res.sucesso) {
                    txtTitulo.value = "";
                    if (txtCorpo) txtCorpo.value = "";
                } else {
                    alert("Não foi possível publicar seu tópico agora. Tente novamente.");
                }
            };
        }

        // Enviar Resposta no Tópico Ativo
        if (btnEnviarResposta && txtNovaResposta) {
            btnEnviarResposta.onclick = async () => {
                const texto = txtNovaResposta.value.trim();
                if (!texto) {
                    alert("Digite algo para comentar!");
                    txtNovaResposta.focus();
                    return;
                }
                if (!topicoAtivoId) return;

                btnEnviarResposta.disabled = true;
                btnEnviarResposta.textContent = "...";

                const autorFormatado = `@${meuNome.toLowerCase().replace(/\s+/g, '_')}`;
                const res = await enviarRespostaTopico(topicoAtivoId, meuUID, autorFormatado, texto);

                btnEnviarResposta.disabled = false;
                btnEnviarResposta.textContent = "Comentar";

                if (res && res.sucesso) {
                    txtNovaResposta.value = "";
                } else {
                    alert("Erro ao enviar comentário: " + (res.erro || "Tente novamente"));
                }
            };

            txtNovaResposta.onkeydown = (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    btnEnviarResposta.click();
                }
            };
        }

        // Mural de Stories / Vibes da Tribo é gerenciado de forma dedicada por app-mural-vibes.js
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeRespostasAtivo) unsubscribeRespostasAtivo();
    };
}

function formatarTempo(isoDate) {
    if (!isoDate) return "recentemente";
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const minutos = Math.floor(diffMs / 60000);
    if (minutos < 1) return "agora mesmo";
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `há ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `há ${dias}d`;
}

function escapeHTML(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttr(str) {
    if (!str) return "";
    return str.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => inicializarForum());
    } else {
        setTimeout(() => inicializarForum(), 50);
    }
}
