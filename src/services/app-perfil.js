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
 * 🪐 Tribbu'sVibe - Sincronizador de Foto de Capa em Tempo Real
 * @param {string} meuUID - UID do perfil a ser escutado
 */
export function escutarPerfilComCapa(meuUID) {
    const txtNome = document.getElementById("lbl-perfil-nome") || document.getElementById("perfil-nome-texto");
    const txtStatus = document.getElementById("lbl-perfil-status") || document.querySelector(".status-tag");
    const txtBio = document.getElementById("lbl-perfil-bio") || document.querySelector(".bio-box p");
    const imgAvatar = document.getElementById("img-avatar-perfil");
    const lblAvatar = document.getElementById("lbl-perfil-avatar");
    const imgCapaDinamica = document.getElementById("img-capa-dinamica");
    
    // Barras de reputação neon
    const barraConfiavel = document.querySelector(".id-barra-confiavel") || document.querySelector(".barra-confiavel");
    const barraLegal = document.querySelector(".id-barra-legal") || document.querySelector(".barra-legal");
    const barraVibe = document.querySelector(".id-barra-vibe") || document.querySelector(".barra-vibe");
    const txtValConfiavel = document.getElementById("txt-val-confiavel");
    const txtValLegal = document.getElementById("txt-val-legal");
    const txtValVibe = document.getElementById("txt-val-vibe");

    // 🪐 Injeção de Dados Pessoais para acoplar no src/services/app-perfil.js
    const lblEstadoCivil = document.getElementById("lbl-estado-civil");
    const lblCidadeAtual = document.getElementById("lbl-cidade-atual");
    const lblCidadeNatal = document.getElementById("lbl-cidade-natal");
    const lblDataNasc = document.getElementById("lbl-data-nascimento");
    const lblSexo = document.getElementById("lbl-sexo");

    if (!meuUID) return;

    console.log("Conectando cano em tempo real com a órbita do perfil...");

    // 🚀 Fallback instantâneo: se o campo estiver com Carregando, preenche com dados locais da sessão
    const meuNomeFallback = auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Membro da Tribo";
    if (txtNome && txtNome.innerText.includes("Carregando")) {
        txtNome.innerText = meuNomeFallback;
    }
    if (txtStatus && txtStatus.innerText.includes("Carregando")) {
        txtStatus.innerText = "🪐 em órbita...";
    }

    // 🔄 ESCUTA EM TEMPO REAL VIA ONSNAPSHOT
    return onSnapshot(doc(db, "usuarios", meuUID), (docSnap) => {
        // Fallback imediato: se o documento não existir ainda, define dados seguros da sessão Auth
        let nomeExibir = meuNomeFallback;
        let statusExibir = "🪐 em órbita...";
        let avatarExibir = auth.currentUser?.photoURL || localStorage.getItem("tribbus_user_avatar_url") || "";
        let capaExibir = "";

        if (docSnap.exists()) {
            const dados = docSnap.data();
            nomeExibir = dados.nome || nomeExibir;
            statusExibir = dados.frase_status || dados.status_vibe || statusExibir;
            avatarExibir = dados.avatar_url || dados.avatar || auth.currentUser?.photoURL || localStorage.getItem("tribbus_user_avatar_url") || avatarExibir;
            capaExibir = dados.foto_capa_url || capaExibir; // 🖼️ Puxa a capa real do banco!

            const valConfiavel = dados.medidor_confiavel ?? 85;
            const valLegal = dados.medidor_legal ?? 50;
            const valVibe = dados.medidor_vibe ?? 100;

            if (dados.bio && txtBio) {
                txtBio.innerText = dados.bio;
            }

            // Atualiza a largura das 3 barras de reputação com os neons acesos
            if (barraConfiavel) barraConfiavel.style.width = `${valConfiavel}%`;
            if (barraLegal) barraLegal.style.width = `${valLegal}%`;
            if (barraVibe) barraVibe.style.width = `${valVibe}%`;

            if (txtValConfiavel) txtValConfiavel.innerText = `${valConfiavel}%`;
            if (txtValLegal) txtValLegal.innerText = `${valLegal}%`;
            if (txtValVibe) txtValVibe.innerText = `${valVibe}%`;

            // 🔥 ADICIONAR ESTE ENCANAMENTO DENTRO DO SEU ONSNAPSHOT DE PERFIL:
            const lblEstadoCivil = document.getElementById("lbl-estado-civil");
            const lblCidadeAtual = document.getElementById("lbl-cidade-atual");
            const lblCidadeNatal = document.getElementById("lbl-cidade-natal");
            const lblDataNasc = document.getElementById("lbl-data-nascimento");
            const lblSexo = document.getElementById("lbl-sexo");

            // Injeta os novos dados pessoais ou mantém o texto padrão se estiver vazio
            if (lblEstadoCivil) lblEstadoCivil.innerText = dados.estado_civil || "Solteiro(a)";
            if (lblCidadeAtual) lblCidadeAtual.innerText = dados.cidade_atual || "Não informado";
            if (lblCidadeNatal) lblCidadeNatal.innerText = dados.cidade_natal || "Não informado";
            if (lblSexo) lblSexo.innerText = dados.sexo || "Não informado";

            // Trata a formatação da data de nascimento (AAAA-MM-DD para DD/MM/AAAA)
            if (lblDataNasc && dados.data_nascimento) {
                const partes = dados.data_nascimento.split("-");
                if (partes.length === 3) {
                    lblDataNasc.innerText = `${partes[2]}/${partes[1]}/${partes[0]}`;
                } else {
                    lblDataNasc.innerText = dados.data_nascimento;
                }
            }
        }

        // 🚀 INJEÇÃO IMEDIATA NA INTERFACE (Arranca o travamento de 'Carregando...')
        if (txtNome) txtNome.innerText = nomeExibir;
        if (txtStatus) txtStatus.innerText = statusExibir;
        
        // Avatar Flutuante
        if (avatarExibir && typeof avatarExibir === "string" && (avatarExibir.startsWith("http") || avatarExibir.startsWith("data:image"))) {
            if (imgAvatar) {
                imgAvatar.src = avatarExibir;
                imgAvatar.style.display = "block";
            }
            if (lblAvatar) lblAvatar.style.display = "none";
        } else if (lblAvatar) {
            lblAvatar.innerText = avatarExibir || "👤";
            lblAvatar.style.display = "block";
            if (imgAvatar) imgAvatar.style.display = "none";
        }
        
        // Aplica a nova capa com estilo de cobertura do Facebook
        if (imgCapaDinamica && capaExibir) {
            imgCapaDinamica.style.background = `url('${capaExibir}') center/cover no-repeat`;
        }
    }, (err) => {
        console.warn("Aviso ao carregar órbita do perfil:", err);
        if (txtNome && txtNome.innerText.includes("Carregando")) {
            txtNome.innerText = meuNomeFallback;
        }
        if (txtStatus && txtStatus.innerText.includes("Carregando")) {
            txtStatus.innerText = "🪐 em órbita...";
        }
    });
}

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
    const imgAvatarPerfil = document.getElementById("img-avatar-perfil");
    const imgCapaDinamica = document.getElementById("img-capa-dinamica");
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

        // 🔄 ESCUTA PERFIL EM TEMPO REAL VIA escutarPerfilComCapa
        const unsubscribePerfil = escutarPerfilComCapa(targetUID);

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
