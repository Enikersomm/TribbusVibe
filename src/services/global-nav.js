// 🪐 Tribbu'sVibe - Sistema Global de Navegação e Logout Seguro
// Arquivo: global-nav.js

import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "./tribbusFirebase.js";
import "./pwa-install.js";

/**
 * Vincula todos os botões de logout da página e sincroniza a navegação
 */
export function inicializarNavegacaoGlobal() {
    // 🚪 Configura o Botão "Sair" em qualquer página
    const botoesLogout = document.querySelectorAll(".btn-logout-global, [data-action='logout']");
    
    botoesLogout.forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const confirma = confirm("Deseja realmente sair da sua conta no Tribbu'sVibe?");
            if (!confirma) return;

            try {
                // Limpa caches locais
                localStorage.removeItem("tribbus_user_avatar_url");
                localStorage.removeItem("tribbus_user_session");
                sessionStorage.clear();

                await signOut(auth);
                console.log("[GlobalNav] Logout efetuado com sucesso.");
                window.location.href = "login.html";
            } catch (err) {
                console.error("[GlobalNav] Erro ao deslogar:", err);
                window.location.href = "login.html";
            }
        });
    });

    // 🛡️ Proteção de Rotas: se estiver em páginas privadas e o usuário não estiver logado, redireciona para login
    const paginasPrivadas = ["feed.html", "perfil.html", "tribos.html", "forum.html", "configuracoes.html"];
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
