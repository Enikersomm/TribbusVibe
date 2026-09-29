// 🪐 Tribbu'sVibe - Encanamento Real do Perfil em Tempo Real
// Arquivo: app-perfil.js

import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { db, auth } from "./tribbusFirebase.js";
import { escutarScrapsDoPerfil, enviarScrapMural } from "./firebase-scraps.js";
import { escutarVitrineAmigos, adicionarAmigoNoTop, removerAmigoDoTop } from "./firebase-top-amigos.js";
import { fazerUploadDeFoto } from "./firebase-storage.js";
import { votarNoTermometroAmigo } from "./firebase-reputacao.js";

/**
 * 🚀 Inicializa o encanamento em tempo real da tela de Perfil (Dark Mode)
 */
export function inicializarPerfilEmTempoReal() {
    // 🚀 REDIRECIONADOR DEFESA TOTAL: Se houver tab=chat ou hash de chat, redireciona na hora para chat.html
    if (typeof window !== "undefined" && (window.location.search.includes("tab=chat") || window.location.hash.includes("chat"))) {
        window.location.replace("chat.html");
        return () => {};
    }

    // Captura os elementos do HTML Dark Mode (compatível com os novos IDs e classes)
    const txtNome = document.getElementById("lbl-perfil-nome") || document.getElementById("perfil-nome-texto");
    const txtBio = document.getElementById("lbl-perfil-bio") || document.querySelector(".bio-box p");
    const txtStatus = document.getElementById("lbl-perfil-status") || document.querySelector(".status-tag");
    const barraConfiavel = document.querySelector(".id-barra-confiavel") || document.querySelector(".barra-confiavel");
    const barraLegal = document.querySelector(".id-barra-legal") || document.querySelector(".barra-legal");
    const barraVibe = document.querySelector(".id-barra-vibe") || document.querySelector(".barra-vibe");
    const txtValConfiavel = document.getElementById("txt-val-confiavel");
    const txtValLegal = document.getElementById("txt-val-legal");
    const txtValVibe = document.getElementById("txt-val-vibe");
    const btnsVotoNeon = document.querySelectorAll(".btn-voto-neon");
    
    const containerAvatar = document.getElementById("btn-tirar-selfie");
    const lblAvatar = document.getElementById("lbl-perfil-avatar");
    const inputCamera = document.getElementById("input-camera-perfil");
    
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

        const urlParams = new URLSearchParams(window.location.search);
        const targetUID = urlParams.get("id") || urlParams.get("uid") || usuario.uid;
        const meuUID = usuario.uid;
        const meuNome = usuario.displayName || usuario.email?.split("@")[0] || "Membro da Tribo";

        // 🚀 ARRANCADA IMEDIATA DO "Carregando...":
        // Garante que o usuário logado nunca fique preso no estado de carregamento se o banco demorar
        if (targetUID === meuUID) {
            if (txtNome && txtNome.innerText.includes("Carregando")) {
                txtNome.innerText = meuNome;
            }
            if (txtStatus && txtStatus.innerText.includes("Carregando")) {
                txtStatus.innerText = "🪐 em órbita...";
            }
        }

        // 🔄 ESCUTA PERFIL EM TEMPO REAL: Atualiza na hora os dados do perfil visualizado!
        const unsubscribePerfil = onSnapshot(doc(db, "usuarios", targetUID), (docSnap) => {
            if (docSnap.exists()) {
                const dados = docSnap.data();
                
                // Injeta os dados nos blocos com as chaves padronizadas (nome, frase_status, medidor_confiavel, medidor_legal, medidor_vibe)
                if(txtNome) txtNome.innerText = dados.nome || (targetUID === meuUID ? meuNome : "Membro da Tribo");
                if(txtBio) txtBio.innerText = dados.bio || "Sem bio por enquanto... ✨";
                if(txtStatus) txtStatus.innerText = dados.frase_status || dados.status_vibe || "🪐 em órbita...";
                
                // Exibe a foto do perfil ou o avatar
                if (lblAvatar) {
                    if (dados.avatar_url && typeof dados.avatar_url === "string" && dados.avatar_url.trim().startsWith("http")) {
                        lblAvatar.innerHTML = `<img src="${escapeHTML(dados.avatar_url)}" alt="Selfie" onerror="this.onerror=null; this.parentElement.innerText='👤';">`;
                    } else if (dados.avatar_emoji) {
                        lblAvatar.innerText = dados.avatar_emoji;
                    } else {
                        lblAvatar.innerText = "👤";
                    }
                }
                
                // Atualiza a largura das barras de reputação em degradê neon e os rótulos de porcentagem
                const valConfiavel = dados.medidor_confiavel ?? 85;
                const valLegal = dados.medidor_legal ?? 90;
                const valVibe = dados.medidor_vibe ?? 100;

                if(barraConfiavel) barraConfiavel.style.width = `${valConfiavel}%`;
                if(barraLegal) barraLegal.style.width = `${valLegal}%`;
                if(barraVibe) barraVibe.style.width = `${valVibe}%`;

                if(txtValConfiavel) txtValConfiavel.innerText = `${valConfiavel}%`;
                if(txtValLegal) txtValLegal.innerText = `${valLegal}%`;
                if(txtValVibe) txtValVibe.innerText = `${valVibe}%`;
            } else {
                // Documento ainda vazio ou em criação: fallback imediato
                if (txtNome && txtNome.innerText.includes("Carregando")) {
                    txtNome.innerText = targetUID === meuUID ? meuNome : "Membro da Tribo";
                }
                if (txtStatus && txtStatus.innerText.includes("Carregando")) {
                    txtStatus.innerText = "🪐 em órbita...";
                }
            }
        }, (err) => {
            console.warn("Aviso ao carregar dados do perfil em tempo real:", err);
            // Fallback em caso de erro de rede ou Firestore
            if (txtNome && txtNome.innerText.includes("Carregando")) {
                txtNome.innerText = targetUID === meuUID ? meuNome : "Membro da Tribo";
            }
            if (txtStatus && txtStatus.innerText.includes("Carregando")) {
                txtStatus.innerText = "🪐 em órbita...";
            }
        });

        // 📸 GATILHO DA CÂMERA DO CELULAR (SELFIE) AO CLICAR NA FOTO
        if (containerAvatar && inputCamera) {
            containerAvatar.onclick = (e) => {
                // Se clicou no input, deixa seguir para não gerar loop
                if (e.target === inputCamera) return;
                inputCamera.click();
            };

            inputCamera.onchange = async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                try {
                    // Feedback visual imediato de carregamento
                    if (lblAvatar) {
                        lblAvatar.innerHTML = `<div style="font-size: 1.2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: var(--ciano-neon);"><i class="fas fa-spinner fa-spin"></i><span style="font-size: 0.65rem; font-weight: bold;">Salvando...</span></div>`;
                    }

                    console.log("[Perfil] Processando selfie capturada:", file.name, file.size);
                    const urlFoto = await fazerUploadDeFoto(file);

                    if (urlFoto) {
                        // 1. Atualiza no Firestore
                        await updateDoc(doc(db, "usuarios", meuUID), {
                            avatar_url: urlFoto
                        });

                        // 2. Atualiza no Auth
                        if (auth.currentUser) {
                            await updateProfile(auth.currentUser, {
                                photoURL: urlFoto
                            }).catch(() => {});
                        }

                        // 3. Atualiza cache local
                        localStorage.setItem("tribbus_user_avatar_url", urlFoto);

                        console.log("[Perfil] Selfie atualizada com sucesso no perfil e Firestore!");
                    }
                } catch (err) {
                    console.error("[Perfil] Erro ao salvar selfie:", err);
                    alert("Não foi possível salvar a selfie. Tente novamente!");
                    if (lblAvatar) lblAvatar.innerText = "👤";
                } finally {
                    inputCamera.value = "";
                }
            };
        }

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

        // 🗳️ VOTAÇÃO MÚTUA DE TERMÔMETROS DE REPUTAÇÃO
        if (btnsVotoNeon && btnsVotoNeon.length > 0) {
            // Verifica se está visualizando o perfil de outro membro via URL (?uid=...)
            const urlParams = new URLSearchParams(window.location.search);
            const alvoUID = urlParams.get("uid") || meuUID;

            btnsVotoNeon.forEach((btn) => {
                btn.onclick = async () => {
                    const tipoTermometro = btn.getAttribute("data-termometro");
                    if (!tipoTermometro) return;

                    btn.disabled = true;
                    const textoOriginal = btn.innerHTML;
                    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Votando...`;

                    const res = await votarNoTermometroAmigo(meuUID, alvoUID, tipoTermometro);
                    
                    if (res.sucesso) {
                        alert("✨ Voto computado com sucesso! A reputação subiu +5%!");
                    } else {
                        alert(res.erro || "⚠️ Erro ao registrar voto.");
                    }

                    btn.innerHTML = textoOriginal;
                    btn.disabled = false;
                };
            });
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
