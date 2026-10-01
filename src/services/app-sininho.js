// 🪐 Tribbu'sVibe - Controlador Dinâmico do Sininho de Notificações
// Arquivo: src/services/app-sininho.js

import { db, auth } from "./tribbusFirebase.js";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";

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
        
        // Se abriu a gaveta, podemos zerar visualmente o contador
        if (!aberta) {
            badgeNum.style.display = "none";
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

            // Se houver alertas novos, faz a bolinha vermelha brilhar
            if (naoLidasContador > 0) {
                badgeNum.innerText = naoLidasContador;
                badgeNum.style.display = "block";
            } else {
                badgeNum.style.display = "none";
            }
        });
    });
}

// Inicializa automaticamente
document.addEventListener("DOMContentLoaded", () => inicializarSininhoDeNotificacoes());
