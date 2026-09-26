// 🪐 Tribbu'sVibe - Lógica do Mural de Vibes da Tribo
// Arquivo: app-mural-vibes.js

import { postarStoryComunidade } from "./firebase-stories.js";
import { query, collection, where, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "./tribbusFirebase.js";

function inicializarMuralVibes() {
    const containerMural = document.getElementById("mural-stories-tribo");
    if (!containerMural) return;

    // ID da tribo ativa (obtém da URL ou fallback para comu_ps2_789)
    const urlParams = new URLSearchParams(window.location.search);
    const triboAtivaID = urlParams.get("tribo") || "comu_ps2_789"; 
    const meuUID = auth?.currentUser?.uid || "user_lara_123";

    // --- 🔄 ESCUTA OS STORIES DA TRIBO ATIVA EM TEMPO REAL ---
    const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const renderizarStories = (snapshot) => {
        // Remove tudo menos o botão de "Adicionar (+)"
        containerMural.innerHTML = `<div class="circle-story" title="Postar uma Vibe rápida de 24h" style="width: 55px; height: 55px; border-radius: 50%; border: 2px dashed #00BFFF; display: flex; justify-content: center; align-items: center; cursor: pointer; font-size: 1.3rem; background: var(--cinza-input); transition: all 0.2s;">➕</div>`;

        snapshot.forEach((docSnap) => {
            const story = docSnap.data();
            const fotoUrl = story.media_url || story.imagem_url || '/TribbusVibe.png';
            // Injeta a bolinha do story com o estilo de borda tracejada em Ciano Neon
            containerMural.innerHTML += `
                <div class="circle-story" style="width: 55px; height: 55px; border-radius: 50%; border: 2px solid var(--ciano-neon, #00BFFF); filter: drop-shadow(0 0 5px var(--ciano-neon, #00BFFF)); cursor:pointer; overflow:hidden; flex-shrink:0; transition: transform 0.2s;" title="Vibe de 24h">
                    <img src="${fotoUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="Vibe" onerror="this.src='/TribbusVibe.png'">
                </div>
            `;
        });
        
        // Re-vincula o clique do botão de adicionar após limpar o container
        configurarCliqueAdicionar();
    };

    try {
        const consultaStories = query(
            collection(db, "comunidades_stories"),
            where("comunidade_id", "==", triboAtivaID),
            where("data_criacao", ">=", vinteQuatroHorasAtras),
            orderBy("data_criacao", "desc")
        );

        onSnapshot(
            consultaStories, 
            renderizarStories,
            (erro) => {
                console.warn("Consulta composta de stories requer índice ou fallback. Usando escuta simples:", erro.message);
                // Fallback para caso ainda não haja índice composto criado no Firestore
                const fallbackQuery = query(
                    collection(db, "comunidades_stories"),
                    where("comunidade_id", "==", triboAtivaID)
                );
                onSnapshot(fallbackQuery, (snapFallback) => {
                    const storiesFiltrados = [];
                    snapFallback.forEach((d) => {
                        const data = d.data();
                        if (data.data_criacao >= vinteQuatroHorasAtras) {
                            storiesFiltrados.push(d);
                        }
                    });
                    renderizarStories(storiesFiltrados);
                });
            }
        );
    } catch (e) {
        console.error("Erro ao inicializar consulta de stories da tribo:", e);
    }

    // --- ✍️ EVENTO DE CLIQUE PARA POSTAR NOVA VIBE ---
    function configurarCliqueAdicionar() {
        const btnAdicionar = containerMural.querySelector(".circle-story");
        if (!btnAdicionar) return;

        btnAdicionar.onclick = async () => {
            const urlSimulada = prompt("Insira o link da sua foto com flash para a Tribo: 📷", "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=300&fit=crop");
            if (!urlSimulada || !urlSimulada.trim()) return;

            console.log("Lançando nova vibe temporária de 24 horas...");
            const usuarioIdAtual = auth?.currentUser?.uid || meuUID;
            await postarStoryComunidade(usuarioIdAtual, triboAtivaID, urlSimulada.trim());
        };
    }
}

// Inicializa quando o DOM estiver pronto
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarMuralVibes);
    } else {
        inicializarMuralVibes();
    }
}

export { inicializarMuralVibes };
