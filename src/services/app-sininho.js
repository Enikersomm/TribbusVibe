// 🪐 Tribbu'sVibe - Controlador Dinâmico do Sininho de Notificações
// Arquivo: src/services/app-sininho.js

import { db, auth } from "./tribbusFirebase.js";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";

// 🪐 Tribbu'sVibe - Sincronizador de Emblema Vermelho no Ícone do Celular (App Badging)
// Código para embutir na escuta em tempo real do Firebase na sua pasta local

export function atualizarBolinhaVermelhaNoIconeDoCelular(totalNaoLidas) {
    // 🛡️ Checa se o celular do usuário suporta a API de Badging moderna
    if ('setAppBadge' in navigator) {
        if (totalNaoLidas > 0) {
            console.log(`📱 Injetando emblema de [${totalNaoLidas}] mensagens direto no ícone do celular!`);
            navigator.setAppBadge(totalNaoLidas).catch((err) => {
                console.error("Erro ao aplicar bolinha vermelha no ícone:", err);
            });
        } else {
            console.log("🧼 Chat limpo! Removendo bolinha vermelha do ícone.");
            navigator.clearAppBadge().catch((err) => {
                console.error("Erro ao limpar emblema do ícone:", err);
            });
        }
    } else {
        console.log("⚠️ Este aparelho ou navegador antigo não suporta notificações no ícone externo.");
    }
}

export function inicializarSininhoDeNotificacoes() {
    const wrapper = document.querySelector(".nav-notificacoes-wrapper");
    const gaveta = document.getElementById("gaveta-sininho-lista");
    const badgeNum = document.getElementById("badge-notificacoes-num");
    const containerItens = document.getElementById("sininho-itens-acumulados");

    if (!wrapper || !gaveta || !badgeNum || !containerItens) return;

    // 👆 CLIQUE NO SININHO: Abre/Fecha a gaveta de notificações
    wrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        const aberta = gaveta.style.display === "block";
        gaveta.style.display = aberta ? "none" : "block";
        
        // Se abriu a gaveta, podemos zerar visualmente o contador e o badge do ícone
        if (!aberta) {
            badgeNum.style.display = "none";
            atualizarBolinhaVermelhaNoIconeDoCelular(0);
        }
    });

    // Fecha a gaveta se o usuário clicar em qualquer outro lugar fora do sininho
    document.addEventListener("click", () => {
        gaveta.style.display = "none";
    });

    // 📡 ESCUTA EM TEMPO REAL DAS NOTIFICAÇÕES DO FIRESTORE
    auth.onAuthStateChanged((usuario) => {
        if (!usuario) return;

        console.log("Conectando cano do sininho com o Firebase Firestore...");

        const qNotificacoes = query(
            collection(db, "notificacoes"),
            where("destino_uid", "==", usuario.uid),
            orderBy("data_criacao", "desc")
        );

        onSnapshot(qNotificacoes, (snapshot) => {
            containerItens.innerHTML = "";
            let naoLidasContador = 0;

            if (snapshot.empty) {
                containerItens.innerHTML = `<div style="font-size: 0.75rem; color: var(--texto-suave); font-style: italic; text-align: center; padding: 10px 0;">Nenhum alerta por enquanto... ✨</div>`;
                badgeNum.style.display = "none";
                atualizarBolinhaVermelhaNoIconeDoCelular(0);
                return;
            }

            snapshot.forEach((docSnap) => {
                const n = docSnap.data();
                if (!n.lida) naoLidasContador++;

                // Monta o item individual da gaveta cyberpunk
                const itemAlerta = document.createElement("div");
                itemAlerta.style.background = "var(--cinza-input, #18181b)";
                itemAlerta.style.padding = "8px 10px";
                itemAlerta.style.borderRadius = "8px";
                itemAlerta.style.fontSize = "0.78rem";
                itemAlerta.style.color = "#FFF";
                itemAlerta.style.borderLeft = n.lida ? "2px solid rgba(255,255,255,0.1)" : "2px solid var(--pink-magenta)";
                
                itemAlerta.innerHTML = `
                    <p style="margin: 0; line-height: 1.3;">${n.mensagem_texto || 'Nova atividade na órbita...'}</p>
                `;
                
                containerItens.appendChild(itemAlerta);
            });

            // Se houver alertas novos, faz a bolinha vermelha brilhar no app e no ícone do celular
            if (naoLidasContador > 0) {
                badgeNum.innerText = naoLidasContador;
                badgeNum.style.display = "block";
            } else {
                badgeNum.style.display = "none";
            }

            // 📱 Atualiza o emblema físico no ícone do celular (PWA Badging)
            atualizarBolinhaVermelhaNoIconeDoCelular(naoLidasContador);
        });
    });
}

// Inicializa automaticamente
document.addEventListener("DOMContentLoaded", () => inicializarSininhoDeNotificacoes());
