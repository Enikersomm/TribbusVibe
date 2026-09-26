// 🪐 Tribbu'sVibe - Encanamento do Botão de Entrada na Comunidade
// Arquivo: app-forum-actions.js

import { entrarNaTribo } from "./firebase-tribos.js";
import { auth } from "./tribbusFirebase.js";

function configurarBotaoParticipar() {
    const btnEntrar = document.getElementById("btn-entrar-tribo");
    
    // Identificadores (usa usuário autenticado se houver, ou fallback local)
    const triboAtivaID = "comu_ps2_789"; 

    if (btnEntrar) {
        btnEntrar.addEventListener("click", async () => {
            const usuarioLogadoUID = auth?.currentUser?.uid || "user_lara_123";

            // Desabilita temporariamente para evitar cliques duplos
            btnEntrar.disabled = true;
            btnEntrar.innerText = "Entrando...";

            console.log("Processando entrada do membro na Tribo...");
            const resultado = await entrarNaTribo(usuarioLogadoUID, triboAtivaID);

            if (resultado.sucesso) {
                // Modifica o visual do botão para indicar sucesso e permanência
                btnEntrar.innerText = "Você participa desta Tribo ✓";
                btnEntrar.style.background = "linear-gradient(135deg, #1F1C33, #151221)";
                btnEntrar.style.border = "1px solid #00FF00"; // Borda neon verde de sucesso
                btnEntrar.style.color = "#00FF00";
                
                alert("🎉 Parabéns! Você agora faz parte de mais uma Tribo de verdade!");
            } else {
                btnEntrar.disabled = false;
                btnEntrar.innerText = "Participar da Tribo";
                alert(`❌ Não foi possível entrar na comu: ${resultado.erro}`);
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
