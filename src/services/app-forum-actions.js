// 🪐 Tribbu'sVibe - Encanamento do Botão de Entrada na Comunidade
// Arquivo: app-forum-actions.js

import { entrarNaTribo } from "./firebase-tribos.js";
import { auth } from "./tribbusFirebase.js";

function configurarBotaoParticipar() {
    const btnEntrar = document.getElementById("btn-participar-tribu-dinamico") || document.getElementById("btn-entrar-tribo");
    
    // Identificadores (usa URL ou tribo oficial)
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const triboAtivaID = urlParams?.get("id") || "tribo_oficial"; 

    if (btnEntrar) {
        btnEntrar.addEventListener("click", async () => {
            const usuarioLogadoUID = auth?.currentUser?.uid || "";
            if (!usuarioLogadoUID) {
                alert("Você precisa estar conectado para entrar na Tribbu!");
                return;
            }

            // Desabilita temporariamente para evitar cliques duplos
            btnEntrar.disabled = true;
            btnEntrar.innerText = "Entrando...";

            console.log("Processando entrada do membro na Tribbu...");
            const resultado = await entrarNaTribo(usuarioLogadoUID, triboAtivaID);

            if (resultado.sucesso) {
                // Modifica o visual do botão para indicar sucesso e permanência
                btnEntrar.innerText = "Você participa desta Tribbu ✓";
                btnEntrar.style.background = "linear-gradient(135deg, #1F1C33, #151221)";
                btnEntrar.style.border = "1px solid #00FF00"; // Borda neon verde de sucesso
                btnEntrar.style.color = "#00FF00";
                
                alert("🎉 Parabéns! Você agora faz parte de mais uma Tribbu!");
            } else {
                btnEntrar.disabled = false;
                btnEntrar.innerText = "Participar da Tribbu";
                alert(`❌ Não foi possível entrar na Tribbu: ${resultado.erro}`);
            }
        });
    }
}

// Inicializa o ouvinte assim que a página carregar
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", configurarBotaoParticipar);
    } else {
        configurarBotaoParticipar();
    }
}
