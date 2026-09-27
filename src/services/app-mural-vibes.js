// 🪐 Tribbu'sVibe - Lógica do Mural de Vibes da Tribo
// Arquivo: app-mural-vibes.js

import { postarStoryComunidade } from "./firebase-stories.js";
import { query, collection, where, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "./tribbusFirebase.js";
import { abrirVisualizadorStory } from "./story-viewer.js";
import { abrirModalPostarVibe } from "./modal-postar-vibe.js";

function inicializarMuralVibes() {
    const containerMural = document.getElementById("mural-stories-tribo");
    if (!containerMural) return;

    // ID da tribo ativa (obtém da URL ou fallback para comu_ps2_789)
    const urlParams = new URLSearchParams(window.location.search);
    const triboAtivaID = urlParams.get("tribo") || "comu_ps2_789"; 
    const meuUID = auth?.currentUser?.uid || "";

    // --- 🔄 ESCUTA OS STORIES DA TRIBO ATIVA EM TEMPO REAL ---
    const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const renderizarStories = (snapshot) => {
        // Remove tudo menos o botão de "Adicionar (+)"
        containerMural.innerHTML = `<div class="circle-story" title="Postar uma Vibe rápida de 24h" style="width: 55px; height: 55px; border-radius: 50%; border: 2px dashed #00BFFF; display: flex; justify-content: center; align-items: center; cursor: pointer; font-size: 1.3rem; background: var(--cinza-input); transition: all 0.2s;">➕</div>`;

        snapshot.forEach((docSnap) => {
            const story = docSnap.data();
            const tipoStory = story.tipo || story.tipo_conteudo || "foto";
            let fotoUrl = story.media_url || story.imagem_url || story.dado_conteudo || '/logo.png';
            
            // Ícone da bolinha dependendo do tipo
            let conteudoBolinha = `<img src="${fotoUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="Vibe" onerror="this.src='/logo.png'">`;
            let corBorda = "var(--ciano-neon, #00BFFF)";

            if (tipoStory === "musica" || tipoStory === "audio") {
                corBorda = "#FF007F";
                conteudoBolinha = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #1f1b2e, #FF007F); font-size:1.3rem;">🎵</div>`;
            } else if (tipoStory === "video") {
                corBorda = "#9d4edd";
                conteudoBolinha = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #121214, #9d4edd); font-size:1.3rem;">🎥</div>`;
            } else if (tipoStory === "texto") {
                corBorda = "#FFD700";
                conteudoBolinha = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:${story.cor_fundo_neon || '#222'}; color:#fff; font-size:0.7rem; font-weight:bold; padding:4px; text-align:center;">VIBE</div>`;
            }

            const storyEl = document.createElement("div");
            storyEl.className = "circle-story";
            storyEl.style.cssText = `width: 55px; height: 55px; border-radius: 50%; border: 2px solid ${corBorda}; filter: drop-shadow(0 0 5px ${corBorda}); cursor:pointer; overflow:hidden; flex-shrink:0; transition: transform 0.2s; position:relative;`;
            storyEl.title = `Vibe de 24h [${tipoStory.toUpperCase()}] (Clique para visualizar)`;
            storyEl.innerHTML = conteudoBolinha;

            storyEl.onclick = () => {
                abrirVisualizadorStory({
                    tipo: tipoStory,
                    dado: story.dado_conteudo || story.media_url || fotoUrl,
                    autorNome: story.autor_nome || "Membro da Tribo",
                    autorAvatar: story.autor_avatar || "👤",
                    tempo: story.data_criacao ? new Date(story.data_criacao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Vibe de 24h",
                    corFundo: story.cor_fundo_neon || "#121214"
                });
            };

            containerMural.appendChild(storyEl);
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

        btnAdicionar.onclick = () => {
            abrirModalPostarVibe(triboAtivaID, () => {
                console.log("Vibe publicada no mural da Tribo!");
            });
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
