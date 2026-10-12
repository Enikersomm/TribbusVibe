// 🪐 Tribbu's Messenger - Ajuste Supremo do Encanamento de Chat Privado & Lista de Contatos
// Arquivo: src/services/app-chat.js

import { enviarMensagemPrivada, escutarChatEmTempoReal } from "./firebase-chat.js";
import { db, auth } from "./tribbusFirebase.js";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function inicializarChatPrivado() {
    const inputMensagem = document.querySelector(".input-chat-texto");
    const btnEnviar = document.querySelector(".btn-enviar-chat");
    const btnAtencao = document.querySelector(".btn-atencao");
    const areaMensagens = document.querySelector(".mensagens-area");
    const janelaChat = document.querySelector(".janela-chat");
    const listaContatosEl = document.getElementById("lista-contatos");
    const chatNomeAmigoEl = document.getElementById("chat-nome-amigo");
    const statusBolinhaEl = document.getElementById("status-bolinha");

    let meuUID = auth.currentUser?.uid || null;
    let amigoUIDAtivo = null;
    let amigoNomeAtivo = "";
    let cancelarEscutaChat = null;

    // 1. MONITOR DE AUTENTICAÇÃO REAL DO FIREBASE
    onAuthStateChanged(auth, (usuario) => {
        if (usuario) {
            meuUID = usuario.uid;
            carregarContatosEmTempoReal();
        } else {
            if (listaContatosEl) {
                listaContatosEl.innerHTML = `
                    <div style="font-size: 0.8rem; color: var(--texto-suave); text-align: center; padding: 20px 10px;">
                        <i class="fas fa-lock" style="font-size: 1.5rem; color: var(--pink-magenta); margin-bottom: 8px; display: block;"></i>
                        Entre na sua conta para conversar com a tribo!
                    </div>
                `;
            }
        }
    });

    // 2. ESCUTA EM TEMPO REAL DE TODOS OS USUÁRIOS DO APP
    function carregarContatosEmTempoReal() {
        if (!listaContatosEl) return;

        listaContatosEl.innerHTML = `
            <div style="font-size: 0.75rem; color: var(--texto-suave); text-align: center; padding: 15px 0;">
                <i class="fas fa-circle-notch fa-spin" style="color: var(--ciano-neon);"></i> Sintonizando contatos da tribo...
            </div>
        `;

        try {
            const consultaUsuarios = query(collection(db, "usuarios"), orderBy("nome", "asc"));
            
            onSnapshot(consultaUsuarios, (snapshot) => {
                const usuarios = [];
                snapshot.forEach((docSnap) => {
                    const dados = docSnap.data();
                    const id = docSnap.id;
                    // Não lista o próprio usuário logado
                    if (id !== meuUID) {
                        usuarios.push({ id, ...dados });
                    }
                });

                if (usuarios.length === 0) {
                    listaContatosEl.innerHTML = `
                        <div style="font-size: 0.8rem; color: var(--texto-suave); text-align: center; padding: 25px 10px; font-style: italic;">
                            Nenhum outro membro encontrado ainda. Convide amigos para a órbita! 🪐
                        </div>
                    `;
                    return;
                }

                listaContatosEl.innerHTML = "";
                usuarios.forEach((usuario) => {
                    const avatarUrl = usuario.foto_url || usuario.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
                    const nome = usuario.nome || usuario.display_name || "Membro da Tribu";
                    const statusVibe = usuario.status_vibe || usuario.vibe_status || "🪐 em órbita...";
                    const isAtivo = usuario.id === amigoUIDAtivo;

                    const itemEl = document.createElement("div");
                    itemEl.className = `contato-item ${isAtivo ? "ativo" : ""}`;
                    itemEl.dataset.uid = usuario.id;
                    itemEl.innerHTML = `
                        <img src="${avatarUrl}" alt="${escapeHTML(nome)}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'">
                        <div class="contato-info" style="flex: 1; min-width: 0;">
                            <strong>${escapeHTML(nome)}</strong>
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.72rem; color: var(--texto-suave);">${escapeHTML(statusVibe)}</span>
                        </div>
                        <span class="status-bolinha" style="width: 8px; height: 8px; border-radius: 50%; background: #00FF88; box-shadow: 0 0 6px #00FF88; flex-shrink: 0;"></span>
                    `;

                    itemEl.addEventListener("click", () => {
                        abrirConversaComAmigo(usuario.id, nome);
                    });

                    listaContatosEl.appendChild(itemEl);
                });

                // Se ainda não abriu conversa e há contatos, seleciona o primeiro por padrão
                if (!amigoUIDAtivo && usuarios.length > 0) {
                    abrirConversaComAmigo(usuarios[0].id, usuarios[0].nome || "Membro da Tribu");
                }
            }, (erro) => {
                console.warn("Erro ao sincronizar lista de contatos:", erro);
                listaContatosEl.innerHTML = `
                    <div style="font-size: 0.75rem; color: var(--pink-magenta); text-align: center; padding: 15px 0;">
                        Erro ao carregar contatos. Verifique sua conexão.
                    </div>
                `;
            });
        } catch (e) {
            console.error("Falha ao abrir consulta de usuários:", e);
        }
    }

    // 3. ABRIR CONVERSA COM UM AMIGO ESPECÍFICO
    function abrirConversaComAmigo(amigoUID, amigoNome) {
        if (!meuUID) return;

        amigoUIDAtivo = amigoUID;
        amigoNomeAtivo = amigoNome;

        // Atualiza estilo visual do contato ativo na lista lateral
        document.querySelectorAll(".contato-item").forEach((el) => {
            if (el.dataset.uid === amigoUID) {
                el.classList.add("ativo");
            } else {
                el.classList.remove("ativo");
            }
        });

        // Atualiza cabeçalho da janela de conversa
        if (chatNomeAmigoEl) {
            chatNomeAmigoEl.textContent = amigoNome;
        }
        if (statusBolinhaEl) {
            statusBolinhaEl.style.display = "inline-block";
        }

        // Cancela escuta da conversa anterior, se houver
        if (typeof cancelarEscutaChat === "function") {
            cancelarEscutaChat();
        }

        if (!areaMensagens) return;

        areaMensagens.innerHTML = `
            <div style="text-align: center; color: var(--texto-suave); font-size: 0.8rem; padding: 20px;">
                <i class="fas fa-circle-notch fa-spin" style="color: var(--ciano-neon);"></i> Carregando mensagens com ${escapeHTML(amigoNome)}...
            </div>
        `;

        // Inicia escuta em tempo real da conversa entre os dois
        cancelarEscutaChat = escutarChatEmTempoReal(meuUID, amigoUID, (mensagens) => {
            const estavaNoFinal = areaMensagens.scrollHeight - areaMensagens.scrollTop <= areaMensagens.clientHeight + 100;
            areaMensagens.innerHTML = "";

            if (mensagens.length === 0) {
                areaMensagens.innerHTML = `
                    <div style="font-size: 0.8rem; color: var(--texto-suave); text-align: center; font-style: italic; margin-top: 30px;">
                        Nenhuma mensagem com <strong>${escapeHTML(amigoNome)}</strong> ainda. Mande um salve na vibe! 🪐
                    </div>
                `;
                return;
            }

            mensagens.forEach((msg) => {
                const classeBalao = msg.remetente_id === meuUID ? "enviado" : "recebido";

                if (msg.is_atencao) {
                    areaMensagens.innerHTML += `<div class="balao atencao-msg" style="background: rgba(255, 0, 127, 0.15); color: var(--pink-magenta); border: 1px solid var(--pink-magenta); text-align: center; font-weight: bold; padding: 6px; border-radius: 8px; margin: 10px 0; box-shadow: 0 0 10px rgba(255, 0, 127, 0.2);">⚠️ CHAMOU A ATENÇÃO! ⚠️</div>`;
                    
                    // Se a mensagem veio do seu amigo nesta conversa ativa
                    if (msg.remetente_id !== meuUID) {
                        
                        // 📱 1. VIBRAÇÃO NO APARELHO
                        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);

                        // 🔊 2. BIPE SONORO NATIVO DO NAVEGADOR
                        try {
                            const contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
                            const oscilador = contextoAudio.createOscillator();
                            const ganho = contextoAudio.createGain();
                            oscilador.type = 'sine';
                            oscilador.frequency.setValueAtTime(880, contextoAudio.currentTime);
                            ganho.gain.setValueAtTime(0.3, contextoAudio.currentTime);
                            oscilador.connect(ganho);
                            ganho.connect(contextoAudio.destination);
                            oscilador.start();
                            oscilador.stop(contextoAudio.currentTime + 0.4);
                        } catch (e) { console.warn(e); }

                        // 🎬 3. TREMEDEIRA DINÂMICA (Foca na areaMensagens da conversa aberta, tirando a dependência de IDs fixos!)
                        if (areaMensagens) {
                            areaMensagens.style.animation = "tremerBalaao 0.1s ease infinite";
                            areaMensagens.style.border = "1px solid var(--pink-magenta)";
                            
                            setTimeout(() => { 
                                if (areaMensagens) {
                                    areaMensagens.style.animation = "none"; 
                                    areaMensagens.style.border = "none";
                                }
                            }, 1000); // Chacoalha a caixa de texto daquela conversa por 1 segundo inteiro
                        }
                    }
                } else {
                    areaMensagens.innerHTML += `<div class="balao ${classeBalao}">${escapeHTML(msg.conteudo_texto)}</div>`;
                }
            });

            if (estavaNoFinal) {
                areaMensagens.scrollTop = areaMensagens.scrollHeight;
            }
        });
    }

    // 4. DISPARO DE MENSAGENS DE TEXTO
    const handleEnviarClick = async () => {
        if (!inputMensagem) return;
        const texto = inputMensagem.value.trim();
        if (!texto || !amigoUIDAtivo || !meuUID) return;

        inputMensagem.value = "";
        await enviarMensagemPrivada(meuUID, amigoUIDAtivo, texto, false);
    };

    if (btnEnviar) {
        btnEnviar.onclick = handleEnviarClick;
    }

    if (inputMensagem) {
        inputMensagem.onkeypress = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleEnviarClick();
            }
        };
    }

    // 5. BOTÃO CHAMAR ATENÇÃO (MSN VIBE)
    if (btnAtencao) {
        btnAtencao.onclick = async () => {
            if (!amigoUIDAtivo || !meuUID) {
                alert("Selecione um contato ao lado para chamar a atenção!");
                return;
            }
            await enviarMensagemPrivada(meuUID, amigoUIDAtivo, "⚠️ Atenção!", true);
        };
    }

    return () => {
        if (typeof cancelarEscutaChat === "function") cancelarEscutaChat();
    };
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Inicialização automática assim que o DOM carregar
if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => inicializarChatPrivado());
    } else {
        inicializarChatPrivado();
    }
}

export default inicializarChatPrivado;
