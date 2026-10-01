// 🪐 Tribbu's Messenger - Ajuste Supremo do Encanamento de Chat Privado
// Arquivo: src/services/app-chat.js

import { enviarMensagemPrivada, escutarChatEmTempoReal } from "./firebase-chat.js";

export function inicializarChatPrivado(meuUIDOverride, amigoUIDOverride) {
    const inputMensagem = document.querySelector(".input-chat-texto");
    const btnEnviar = document.querySelector(".btn-enviar-chat");
    const btnAtencao = document.querySelector(".btn-atencao");
    const areaMensagens = document.querySelector(".mensagens-area");
    const janelaChat = document.querySelector(".janela-chat");

    if (!inputMensagem || !btnEnviar || !btnAtencao || !areaMensagens) {
        return () => {};
    }

    const meuUID = meuUIDOverride || "user_lara_123";
    const amigoUID = amigoUIDOverride || "user_lucas_456";

    // --- ESCUTA EM TEMPO REAL BLINDADA ---
    const cancelarEscuta = escutarChatEmTempoReal(meuUID, amigoUID, (mensagens) => {
        // Guarda a posição atual da rolagem para evitar o efeito "avalanche" brusco
        const estavaNoFinal = areaMensagens.scrollHeight - areaMensagens.scrollTop <= areaMensagens.clientHeight + 100;

        areaMensagens.innerHTML = ""; // Limpa com segurança para redesenhar o histórico completo

        if (mensagens.length === 0) {
            areaMensagens.innerHTML = `<div style="font-size: 0.75rem; color: var(--texto-suave, #9AA0A6); text-align: center; font-style: italic; margin-top: 20px;">Nenhuma mensagem por aqui... Comece o papo! 🪐</div>`;
            return;
        }

        mensagens.forEach((msg) => {
            // Checa dinamicamente quem mandou para aplicar a classe certa no balão
            const classeBalao = msg.remetente_id === meuUID ? "enviado" : "recebido";
            
            if (msg.is_atencao) {
                areaMensagens.innerHTML += `<div class="balao atencao-msg" style="background: rgba(255, 0, 127, 0.15); color: var(--pink-magenta); border: 1px solid var(--pink-magenta); text-align: center; font-weight: bold; padding: 6px; border-radius: 8px; margin: 10px 0; box-shadow: 0 0 10px rgba(255, 0, 127, 0.2); animation: pulsarLogo 1s infinite;">⚠️ CHAMOU A ATENÇÃO! ⚠️</div>`;
                
                // Se a mensagem de atenção foi enviada pelo amigo (e não por você mesmo)
                if (msg.remetente_id !== meuUID) {
                    
                    // 📱 1. VIBRAÇÃO FÍSICA DO CELULAR (3 pulsos de choque: vibra, para, vibra, para, vibra)
                    if ('vibrate' in navigator) {
                        navigator.vibrate([300, 100, 300, 100, 500]);
                    }

                    // 🔊 2. EFEITO SONORO RETRÔ DO MSN (Injeta um bipe via código sem precisar de arquivo externo!)
                    try {
                        const contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
                        const oscilador = contextoAudio.createOscillator();
                        const ganho = contextoAudio.createGain();
                        
                        oscilador.type = 'sine'; // Som de bipe limpo
                        oscilador.frequency.setValueAtTime(880, contextoAudio.currentTime); // Frequência do bipe
                        ganho.gain.setValueAtTime(0.3, contextoAudio.currentTime); // Volume controlado
                        
                        oscilador.connect(ganho);
                        ganho.connect(contextoAudio.destination);
                        
                        oscilador.start();
                        oscilador.stop(contextoAudio.currentTime + 0.4); // Toca por 0.4 segundos
                    } catch (erroAudio) {
                        console.warn("Navegador bloqueou o som por falta de interação inicial:", erroAudio);
                    }

                    // 🎬 3. CHACOALHAR VISUAL DA TELA
                    if (janelaChat) {
                        janelaChat.style.animation = "tremerBalaao 0.1s ease infinite";
                        janelaChat.style.boxShadow = "0 0 30px var(--pink-magenta)";
                        
                        setTimeout(() => { 
                            if (janelaChat) {
                                janelaChat.style.animation = "none"; 
                                janelaChat.style.boxShadow = "none";
                            }
                        }, 1000); // Chacoalha por 1 segundo inteiro
                    }
                }
            } else {
                areaMensagens.innerHTML += `<div class="balao ${classeBalao}">${escapeHTML(msg.conteudo_texto)}</div>`;
            }
        });

        // Só joga a barra para baixo de vez se o usuário já estava lendo as últimas mensagens
        if (estavaNoFinal) {
            areaMensagens.scrollTop = areaMensagens.scrollHeight;
        }
    });

    // --- ENVIAR MENSAGEM TEXTO ---
    const handleEnviarClick = async () => {
        const texto = inputMensagem.value.trim();
        if (!texto) return;

        inputMensagem.value = ""; // Limpa o campo na mesma hora para dar sensação de velocidade
        await enviarMensagemPrivada(meuUID, amigoUID, texto, false);
    };

    btnEnviar.onclick = handleEnviarClick;

    inputMensagem.onkeypress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleEnviarClick();
        }
    };

    // --- BOTÃO CHAMAR ATENÇÃO (MSN VIBE) ---
    btnAtencao.onclick = async () => {
        await enviarMensagemPrivada(meuUID, amigoUID, "⚠️ Atenção!", true);
    };

    return () => {
        if (typeof cancelarEscuta === "function") cancelarEscuta();
    };
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
