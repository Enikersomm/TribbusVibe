// 🪐 Tribbu'sVibe - Encanamento Central da Interface (Lógica dos Botões)
// Arquivo: app.js

import { realizarLogin, realizarLogout, realizarCadastro } from "./firebase-auth-login.js";
import RotasTribbusVibe from "./rotas-navegacao.js";

/**
 * 🚪 ENCANAMENTO DO BOTÃO DE SAÍDA (LOGOUT)
 */
export function configurarBotaoSair() {
    // Captura o ícone de coroa ou um botão de logout que colocarmos na Navbar
    const btnSair = document.querySelector(".nav-user");

    if (btnSair && !btnSair.dataset.vibeLogoutEncaminhado) {
        btnSair.dataset.vibeLogoutEncaminhado = "true";
        // Quando o usuário der um clique duplo (ou clique simples) para deslogar
        btnSair.addEventListener("click", async () => {
            const confirmar = confirm("Deseja desconectar da sua Tribo por hoje e descansar a mente? ☕");
            
            if (confirmar) {
                console.log("Encerrando sessão com segurança...");
                await realizarLogout(); // Roda a função do Firebase Auth que o joga na tela de login
            }
        });
    }
}

// 🚀 FUNÇÃO DE INICIALIZAÇÃO DO ENCANAMENTO
export function inicializarEncanamentoCentral() {
    // --- 1. ENCANAMENTO DA TELA DE LOGIN ---
    const formularioLogin = document.querySelector(".form-box:nth-of-type(1) form");
    
    if (formularioLogin && !formularioLogin.dataset.vibeEncaminhado) {
        formularioLogin.dataset.vibeEncaminhado = "true";
        formularioLogin.addEventListener("submit", async (e) => {
            e.preventDefault(); // Impede a página de dar F5 sozinha
            
            const emailInput = formularioLogin.querySelector("input[type='email']");
            const senhaInput = formularioLogin.querySelector("input[type='password']");
            const email = emailInput ? emailInput.value.trim() : "";
            const senha = senhaInput ? senhaInput.value : "";

            console.log("Tentando conectar usuário na tribo...");
            
            // Dispara a função do Firebase Auth
            const resultado = await realizarLogin(email, senha);
            
            if (!resultado.sucesso) {
                alert(`❌ Erro no acesso: ${resultado.erro}`);
            }
        });
    }

    // --- 2. ENCANAMENTO DA TELA DE CADASTRO ---
    const formularioCadastro = document.querySelector(".form-box:nth-of-type(2) form");
    
    if (formularioCadastro && !formularioCadastro.dataset.vibeEncaminhado) {
        formularioCadastro.dataset.vibeEncaminhado = "true";
        formularioCadastro.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const nomeInput = formularioCadastro.querySelector("input[type='text']");
            const emailInput = formularioCadastro.querySelector("input[type='email']");
            const senhaInput = formularioCadastro.querySelector("input[type='password']");
            const dataInput = formularioCadastro.querySelector("input[type='date']");

            const nome = nomeInput ? nomeInput.value.trim() : "";
            const email = emailInput ? emailInput.value.trim() : "";
            const senha = senhaInput ? senhaInput.value : "";
            const dataNascimento = dataInput ? dataInput.value : "";

            // Validação simples antes de enviar para o banco
            if (senha.length < 6) {
                alert("⚠️ Por segurança, sua senha precisa ter pelo menos 6 caracteres.");
                return;
            }

            console.log("Criando nova conta na nossa sociedade digital...");
            
            // Dispara a criação no Firebase Auth + Firestore
            const resultado = await realizarCadastro(nome, email, senha, dataNascimento);
            
            if (resultado.sucesso) {
                alert("🎉 Bem-vindo ao Tribbu'sVibe! Conta criada na maior tranquilidade.");
                // Redireciona o novo fundador direto para a Home
                RotasTribbusVibe.irParaHome();
            } else {
                alert(`❌ Erro ao criar conta: ${resultado.erro}`);
            }
        });
    }

    // --- 3. ENCANAMENTO DO BOTÃO DE SAÍDA (LOGOUT) ---
    configurarBotaoSair();
}

// Inicializa a escuta do botão assim que a página terminar de carregar
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", configurarBotaoSair);
    } else {
        configurarBotaoSair();
    }
}

// 🚀 AGUARDA A TELA CARREGAR TOTALMENTE OU EXECUTA IMEDIATAMENTE SE JÁ CARREGADA
if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarEncanamentoCentral);
    } else {
        inicializarEncanamentoCentral();
    }
}

export default inicializarEncanamentoCentral;
