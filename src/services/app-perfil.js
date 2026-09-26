// 🪐 Tribbu'sVibe - Encanamento Real do Perfil em Tempo Real
// Arquivo: app-perfil.js

import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./tribbusFirebase.js";
import { escutarScrapsDoPerfil, enviarScrapMural } from "./firebase-scraps.js";
import { escutarVitrineAmigos, adicionarAmigoNoTop, removerAmigoDoTop } from "./firebase-top-amigos.js";

/**
 * 🚀 Inicializa o encanamento em tempo real da tela de Perfil (Dark Mode)
 */
export function inicializarPerfilEmTempoReal() {
    // Captura os elementos do HTML Dark Mode (compatível com os novos IDs e classes)
    const txtNome = document.getElementById("lbl-perfil-nome") || document.getElementById("perfil-nome-texto");
    const txtBio = document.getElementById("lbl-perfil-bio") || document.querySelector(".bio-box p");
    const txtStatus = document.getElementById("lbl-perfil-status") || document.querySelector(".status-tag");
    const barraConfiavel = document.querySelector(".id-barra-confiavel") || document.querySelector(".barra-confiavel");
    const barraLegal = document.querySelector(".id-barra-legal") || document.querySelector(".barra-legal");
    const barraVibe = document.querySelector(".id-barra-vibe") || document.querySelector(".barra-vibe");
    
    const txtScrapInput = document.getElementById("txt-vibe-mural") || document.getElementById("txt-scrap-mural");
    const btnPostarScrap = document.getElementById("btn-postar-vibe") || document.getElementById("btn-postar-scrap");
    const containerScraps = document.getElementById("container-vibes-mural") || document.getElementById("container-scraps");

    const gradeTopAmigos = document.getElementById("grade-favoritos-lateral") || document.getElementById("grade-top-amigos");
    const contagemTopAmigos = document.getElementById("lbl-total-favoritos") || document.getElementById("contagem-top-amigos");
    const btnAddTopAmigo = document.getElementById("btn-adicionar-favorito");

    // 🔐 MONITOR DE AUTENTICAÇÃO: Descobre quem é o usuário logado
    const unsubscribeAuth = onAuthStateChanged(auth, (usuario) => {
        if (!usuario) {
            // Se estiver em standalone perfil.html e não logado, redireciona para a entrada
            if (typeof window !== "undefined" && window.location.pathname.includes("perfil.html")) {
                window.location.href = "/";
            }
            return;
        }

        const meuUID = usuario.uid;
        const meuNome = usuario.displayName || usuario.email?.split("@")[0] || "Membro da Tribo";

        // 🔄 ESCUTA PERFIL EM TEMPO REAL: Se ele mudar a bio nas configurações, atualiza aqui na hora!
        const unsubscribePerfil = onSnapshot(doc(db, "usuarios", meuUID), (docSnap) => {
            if (docSnap.exists()) {
                const dados = docSnap.data();
                
                // Injeta os dados nos blocos
                if(txtNome) txtNome.innerText = dados.nome || meuNome;
                if(txtBio) txtBio.innerText = dados.bio || "Sem bio por enquanto... ✨";
                if(txtStatus) txtStatus.innerText = dados.status_vibe || "🪐 em órbita...";
                
                // Atualiza a largura das barras de reputação em degradê neon
                if(barraConfiavel) barraConfiavel.style.width = `${dados.medidor_confiavel || 50}%`;
                if(barraLegal) barraLegal.style.width = `${dados.medidor_legal || 50}%`;
                if(barraVibe) barraVibe.style.width = `${dados.medidor_vibe || 50}%`;
            }
        }, (err) => {
            console.warn("Aviso ao carregar dados do perfil em tempo real:", err);
        });

        // 📥 ESCUTA O MURAL DE SCRAPS EM TEMPO REAL
        let unsubscribeScraps = () => {};
        if (containerScraps) {
            unsubscribeScraps = escutarScrapsDoPerfil(meuUID, (scraps) => {
                containerScraps.innerHTML = ""; // Limpa a lista antiga
                
                if(scraps.length === 0) {
                    containerScraps.innerHTML = `<p style="font-size:0.85rem; color:#A5A2B8; font-style:italic;">Nenhum scrap por aqui ainda. Deixe o primeiro! 👇</p>`;
                    return;
                }

                scraps.forEach((scrap) => {
                    const div = document.createElement("div");
                    div.className = "scrap-item";
                    div.innerHTML = `
                        <div class="scrap-topo"><strong>${scrap.remetente_nome || "@amigo"}</strong> <span>agora mesmo</span></div>
                        <p class="scrap-texto">${escapeHTML(scrap.conteudo_texto || "")}</p>
                    `;
                    containerScraps.appendChild(div);
                });
            });
        }

        // 🌟 ESCUTA A VITRINE DE AMIGOS FAVORITOS EM TEMPO REAL (SEM LIMITE)
        let unsubscribeAmigos = () => {};
        if (gradeTopAmigos) {
            unsubscribeAmigos = escutarVitrineAmigos(meuUID, (amigos) => {
                if (contagemTopAmigos) {
                    contagemTopAmigos.textContent = String(amigos.length);
                }

                gradeTopAmigos.innerHTML = "";
                if (amigos.length === 0) {
                    gradeTopAmigos.innerHTML = `
                        <div style="grid-column: span 3; text-align: center; font-size: 0.75rem; color: #A5A2B8; padding: 10px 0; font-style: italic;">
                            Nenhum amigo na vitrine ainda. Clique em + Adicionar! 🌟
                        </div>
                    `;
                    return;
                }

                amigos.forEach((amigo) => {
                    const card = document.createElement("div");
                    card.className = "amigo-favorito-card";
                    card.innerHTML = `
                        <button class="amigo-favorito-remover" title="Remover da vitrine" data-id="${amigo.id}">✕</button>
                        <img class="amigo-favorito-avatar" src="${escapeHTML(amigo.amigo_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')}" alt="${escapeHTML(amigo.amigo_nome)}" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'">
                        <span class="amigo-favorito-nome" title="${escapeHTML(amigo.amigo_nome)}">${escapeHTML(amigo.amigo_nome)}</span>
                    `;

                    // Ação de remover
                    const btnRemover = card.querySelector(".amigo-favorito-remover");
                    if (btnRemover) {
                        btnRemover.addEventListener("click", async (ev) => {
                            ev.stopPropagation();
                            if (confirm(`Remover ${amigo.amigo_nome} da sua vitrine?`)) {
                                await removerAmigoDoTop(amigo.id);
                            }
                        });
                    }

                    gradeTopAmigos.appendChild(card);
                });
            });
        }

        // ➕ BOTÃO DE ADICIONAR AMIGO NA VITRINE
        if (btnAddTopAmigo) {
            btnAddTopAmigo.onclick = async () => {
                const nome = prompt("Qual o nome do amigo que você quer favoritar na sua vitrine?");
                if (!nome || !nome.trim()) return;

                const avatar = prompt("URL do Avatar/Foto (ou deixe em branco para avatar automático):");
                const amigoId = "amigo-" + Date.now();
                const avatarFinal = avatar && avatar.trim() 
                    ? avatar.trim() 
                    : `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 99999999)}?w=150&auto=format&fit=crop&q=80`;

                await adicionarAmigoNoTop(meuUID, amigoId, nome.trim(), avatarFinal);
            };
        }

        // ✍️ ENVIAR NOVO SCRAP NO MURAL
        if (btnPostarScrap && txtScrapInput) {
            btnPostarScrap.onclick = async (e) => {
                if (e) e.preventDefault();
                const texto = txtScrapInput.value.trim();
                if (!texto) return;

                txtScrapInput.value = ""; // Limpa a caixinha na hora
                const handleFormatado = `@${meuNome.toLowerCase().replace(/\s+/g, '_')}`;
                await enviarScrapMural(meuUID, handleFormatado, meuUID, texto); // Postando no próprio mural
            };
        }
    });

    return unsubscribeAuth;
}

function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Inicializa automaticamente se executado diretamente no navegador
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => inicializarPerfilEmTempoReal());
    } else {
        setTimeout(() => inicializarPerfilEmTempoReal(), 50);
    }
}
