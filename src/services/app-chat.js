// 🪐 Tribbu'sVibe - Encanamento do Chat Privado (Direct Vibe)
// Arquivo: app-chat.js

import { auth, db } from "./tribbusFirebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, limit, getDocs } from "firebase/firestore";
import { enviarMensagemPrivada, escutarChatEmTempoReal } from "./firebase-chat.js";

let canceladorEscutaAtual = null;

export function inicializarChatPrivado() {
    const inputMensagem = document.querySelector(".input-chat-texto");
    const btnEnviar = document.querySelector(".btn-enviar-chat");
    const btnAtencao = document.querySelector(".btn-atencao");
    const areaMensagens = document.querySelector(".mensagens-area");
    const janelaChat = document.querySelector(".janela-chat");
    const listaContatosEl = document.getElementById("lista-contatos");
    const nomeAmigoEl = document.getElementById("chat-nome-amigo");
    const statusBolinhaEl = document.getElementById("status-bolinha");

    if (!inputMensagem || !btnEnviar || !btnAtencao || !areaMensagens) {
        return;
    }

    let meuUID = "";
    let amigoUID = "";
    let amigoNome = "Amigo da Tribo";

    function abrirConversaCom(uid, nome, foto) {
        amigoUID = uid;
        amigoNome = nome || "Amigo";

        if (nomeAmigoEl) {
            nomeAmigoEl.textContent = amigoNome;
        }
        if (statusBolinhaEl) {
            statusBolinhaEl.style.display = "inline-block";
        }

        // Destaque visual no contato selecionado
        document.querySelectorAll(".contato-item").forEach(item => {
            if (item.dataset.uid === uid) {
                item.classList.add("ativo");
            } else {
                item.classList.remove("ativo");
            }
        });

        // Cancela escuta anterior
        if (typeof canceladorEscutaAtual === "function") {
            canceladorEscutaAtual();
            canceladorEscutaAtual = null;
        }

        areaMensagens.innerHTML = `<p style="text-align: center; color: var(--texto-suave); font-size: 0.85rem; padding: 20px;">Carregando mensagens com ${amigoNome}...</p>`;

        // Ativa escuta em tempo real
        canceladorEscutaAtual = escutarChatEmTempoReal(meuUID, amigoUID, (mensagens) => {
            areaMensagens.innerHTML = "";

            if (!mensagens || mensagens.length === 0) {
                areaMensagens.innerHTML = `
                    <div style="text-align: center; color: var(--texto-suave); font-size: 0.85rem; padding: 30px;">
                        <i class="fas fa-comment-dots" style="font-size: 2rem; color: var(--ciano-neon); margin-bottom: 10px; display: block;"></i>
                        Inicie uma conversa na vibe com <strong>${amigoNome}</strong>!
                    </div>
                `;
                return;
            }

            mensagens.forEach((msg) => {
                const classeBalao = msg.remetente_id === meuUID ? "enviado" : "recebido";
                
                if (msg.is_atencao) {
                    areaMensagens.innerHTML += `<div class="balao atencao-msg">⚠️ Chamou a atenção! ⚠️</div>`;
                    
                    if (msg.remetente_id !== meuUID && janelaChat) {
                        janelaChat.classList.add("tremer-tela");
                        setTimeout(() => { 
                            janelaChat.classList.remove("tremer-tela");
                        }, 1000);
                    }
                } else {
                    const textoLimpo = String(msg.conteudo_texto || "")
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                    areaMensagens.innerHTML += `<div class="balao ${classeBalao}">${textoLimpo}</div>`;
                }
            });

            areaMensagens.scrollTop = areaMensagens.scrollHeight;
        });
    }

    async function carregarListaDeAmigos() {
        if (!listaContatosEl) return;
        listaContatosEl.innerHTML = `<p style="font-size: 0.8rem; color: var(--texto-suave); text-align: center; padding: 15px;">Buscando amigos...</p>`;

        try {
            const usuariosSnap = await getDocs(query(collection(db, "usuarios"), limit(25)));
            const contatos = [];

            usuariosSnap.forEach((docSnap) => {
                const dados = docSnap.data();
                const uid = docSnap.id;
                if (uid !== meuUID) {
                    contatos.push({
                        uid,
                        nome: dados.nome || dados.displayName || dados.username || "Membro da Tribo",
                        foto: dados.fotoPerfil || dados.photoURL || "/logo.png"
                    });
                }
            });

            if (contatos.length === 0) {
                listaContatosEl.innerHTML = `<p style="font-size: 0.8rem; color: var(--texto-suave); text-align: center; padding: 15px;">Nenhum outro usuário encontrado ainda.</p>`;
                return;
            }

            listaContatosEl.innerHTML = "";
            contatos.forEach((c, idx) => {
                const item = document.createElement("div");
                item.className = "contato-item";
                item.dataset.uid = c.uid;
                item.innerHTML = `
                    <img src="${c.foto}" alt="${c.nome}" onerror="this.onerror=null; this.src='/logo.png';">
                    <div class="contato-info">
                        <strong>${c.nome}</strong>
                        <span>Clique para conversar</span>
                    </div>
                `;
                item.addEventListener("click", () => {
                    abrirConversaCom(c.uid, c.nome, c.foto);
                });
                listaContatosEl.appendChild(item);

                // Abre a primeira conversa automaticamente se nenhuma estiver aberta
                if (idx === 0 && !amigoUID) {
                    abrirConversaCom(c.uid, c.nome, c.foto);
                }
            });
        } catch (err) {
            console.warn("Erro ao listar contatos:", err);
            listaContatosEl.innerHTML = `<p style="font-size: 0.8rem; color: var(--texto-suave); text-align: center; padding: 15px;">Inicie o chat direto digitando abaixo.</p>`;
        }
    }

    // Identificação de sessão
    onAuthStateChanged(auth, (user) => {
        if (user) {
            meuUID = user.uid;
        } else {
            meuUID = "visitante_" + Math.random().toString(36).substring(2, 8);
        }
        carregarListaDeAmigos();
    });

    // Enviar mensagem
    const handleEnviarClick = async () => {
        const texto = inputMensagem.value.trim();
        if (!texto) return;

        if (!amigoUID) {
            alert("Selecione um contato na lista à esquerda para conversar!");
            return;
        }

        inputMensagem.value = "";
        await enviarMensagemPrivada(meuUID, amigoUID, texto, false);
    };

    btnEnviar.addEventListener("click", handleEnviarClick);

    inputMensagem.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            btnEnviar.click();
        }
    });

    // Chamar atenção (MSN)
    btnAtencao.addEventListener("click", async () => {
        if (!amigoUID) {
            alert("Selecione um contato primeiro!");
            return;
        }
        await enviarMensagemPrivada(meuUID, amigoUID, "⚠️ Atenção!", true);
    });
}

// Inicialização automática
if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => inicializarChatPrivado());
    } else {
        inicializarChatPrivado();
    }
}

export default inicializarChatPrivado;
