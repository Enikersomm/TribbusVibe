// 🪐 Tribbu'sVibe - Encanamento do Chat Privado (Direct Vibe)
// Arquivo: app-chat.js

import { enviarMensagemPrivada, escutarChatEmTempoReal } from "./firebase-chat.js";

export function inicializarChatPrivado(meuUIDOverride, amigoUIDOverride) {
    // Captura os elementos reais da nossa tela Dark Mode
    const inputMensagem = document.querySelector(".input-chat-texto");
    const btnEnviar = document.querySelector(".btn-enviar-chat");
    const btnAtencao = document.querySelector(".btn-atencao");
    const areaMensagens = document.querySelector(".mensagens-area");
    const janelaChat = document.querySelector(".janela-chat");

    if (!inputMensagem || !btnEnviar || !btnAtencao || !areaMensagens) {
        return () => {};
    }

    // IDs para o teste/sessão (usa os IDs reais se fornecidos, ou fallback)
    const meuUID = meuUIDOverride || "user_lara_123";
    const amigoUID = amigoUIDOverride || "user_lucas_456";

    // --- ESCUTA EM TEMPO REAL ---
    // Ativa o ouvinte do Firebase para renderizar as mensagens automaticamente
    const cancelarEscuta = escutarChatEmTempoReal(meuUID, amigoUID, (mensagens) => {
        areaMensagens.innerHTML = ""; // Limpa a janela antiga

        mensagens.forEach((msg) => {
            const classeBalao = msg.remetente_id === meuUID ? "enviado" : "recebido";
            
            if (msg.is_atencao) {
                // Injeta a mensagem especial de atenção
                areaMensagens.innerHTML += `<div class="balao atencao-msg">⚠️ Chamou a atenção! ⚠️</div>`;
                
                // Se a atenção foi enviada pelo amigo, faz a tela do usuário tremer!
                if (msg.remetente_id !== meuUID && janelaChat) {
                    janelaChat.style.animation = "tremerBalaão 0.3s ease infinite";
                    setTimeout(() => { 
                        if (janelaChat) janelaChat.style.animation = "none"; 
                    }, 1000);
                }
            } else {
                // Injeta o balão normal de texto
                areaMensagens.innerHTML += `<div class="balao ${classeBalao}">${msg.conteudo_texto}</div>`;
            }
        });

        // Joga a barra de rolagem sempre para a última mensagem enviada
        areaMensagens.scrollTop = areaMensagens.scrollHeight;
    });

    // --- BOTÃO ENVIAR MENSAGEM TEXTO ---
    const handleEnviarClick = async () => {
        const texto = inputMensagem.value.trim();
        if (!texto) return;

        inputMensagem.value = ""; // Limpa o campo imediatamente
        await enviarMensagemPrivada(meuUID, amigoUID, texto, false);
    };

    btnEnviar.addEventListener("click", handleEnviarClick);

    // Enviar também ao apertar a tecla Enter no teclado
    const handleKeypress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            btnEnviar.click();
        }
    };
    inputMensagem.addEventListener("keypress", handleKeypress);

    // --- BOTÃO CHAMAR ATENÇÃO (MSN VIBE) ---
    const handleAtencaoClick = async () => {
        await enviarMensagemPrivada(meuUID, amigoUID, "⚠️ Atenção!", true);
    };
    btnAtencao.addEventListener("click", handleAtencaoClick);

    return () => {
        if (typeof cancelarEscuta === "function") cancelarEscuta();
        btnEnviar.removeEventListener("click", handleEnviarClick);
        inputMensagem.removeEventListener("keypress", handleKeypress);
        btnAtencao.removeEventListener("click", handleAtencaoClick);
    };
}

// Execução automática ao carregar o DOM se estiver em script independente
if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => inicializarChatPrivado());
    } else {
        inicializarChatPrivado();
    }
}

export default inicializarChatPrivado;
