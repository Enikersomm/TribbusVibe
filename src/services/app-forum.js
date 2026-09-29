// 🪐 Tribbu'sVibe - Encanamento do Fórum da Tribo (Tempo Real)
// Arquivo: app-forum.js

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./tribbusFirebase.js";
import { 
  obterDadosTribo, 
  escutarTopicosDaTribo, 
  lancarNovoTopico, 
  alternarParticipacaoTribo 
} from "./firebase-forum.js";
import { postarStoryComunidade, escutarStoriesAtivos } from "./firebase-stories.js";
import { enviarRespostaTopico, escutarRespostasDoTopico } from "./firebase-respostas.js";

export function inicializarForum() {
    // Parâmetro de URL para tribo customizada se houver
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const triboId = params?.get("id") || "tribo_oficial";

    const lblNome = document.getElementById("lbl-nome-tribo");
    const lblDesc = document.getElementById("lbl-desc-tribo");
    const btnParticipar = document.getElementById("btn-entrar-tribo");
    
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

    // 1. Carrega dados da Tribo
    obterDadosTribo(triboId).then((dados) => {
        if (dados) {
            if (lblNome && dados.nome) lblNome.textContent = dados.nome;
            if (lblDesc && dados.descricao) lblDesc.textContent = dados.descricao;
        }
    });

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

        // Botão Participar é gerenciado por app-forum-actions.js

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
