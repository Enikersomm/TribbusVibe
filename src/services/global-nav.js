// 🪐 Tribbu'sVibe - Sistema Global de Navegação e Logout Seguro
// Arquivo: global-nav.js

import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "./tribbusFirebase.js";
import "./pwa-install.js";

// 🚪 Purgação Suprema e Logout Seguro
window.executarSaidaSuprema = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const confirmou = confirm("🪐 Deseja realmente sair da sua órbita e fechar o Tribbu'sVibe?");
    if (!confirmou) return;

    try {
        console.log("Purificando os tokens e encerrando sessão no Google Firebase...");
        // 1. Destrói a sessão oficial no Firebase Auth
        await signOut(auth);
        
        // 2. Limpa completamente a memória de cache local do celular
        localStorage.clear();
        sessionStorage.clear();

        alert("Órbita encerrada com segurança! Até a próxima vibe. 🪐");
        // 3. Joga o usuário deslogado na marra para a tela de entrada
        window.location.href = "index.html";
    } catch (err) {
        console.error("Erro ao deslogar:", err);
        window.location.href = "index.html";
    }
};

/**
 * Vincula todos os botões de logout da página e sincroniza a navegação
 */
export function inicializarNavegacaoGlobal() {
    // 🚪 Configura o Botão "Sair" em qualquer página
    const botoesLogout = document.querySelectorAll(".btn-logout-global, [data-action='logout'], #btn-sair-vibe");
    
    botoesLogout.forEach((btn) => {
        btn.onclick = (e) => window.executarSaidaSuprema(e);
    });

    // 🛡️ Proteção de Rotas: se estiver em páginas privadas e o usuário não estiver logado, redireciona para login
    const paginasPrivadas = ["feed.html", "perfil.html", "tribos.html", "forum.html", "configuracoes.html", "criar-tribo.html", "criar-tribu.html", "chat.html"];
    const caminhoAtual = window.location.pathname.split("/").pop() || "index.html";

    if (paginasPrivadas.includes(caminhoAtual)) {
        onAuthStateChanged(auth, (usuario) => {
            if (!usuario) {
                console.log("[GlobalNav] Sessão não detectada, redirecionando para login.html");
                window.location.href = "login.html";
            }
        });
    }
}

// Auto-inicialização quando o DOM estiver pronto
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarNavegacaoGlobal);
    } else {
        inicializarNavegacaoGlobal();
    }
}
