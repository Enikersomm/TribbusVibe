// 🪐 Tribbu'sVibe - Controlador Dinâmico do Próximos Rolês
// Arquivo: src/services/app-roles.js

import { db, auth } from "./tribbusFirebase.js";
import { doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/**
 * 📡 Inicializa a Presença do Rolê (Coleção roles)
 * Com alternância (Union/Remove), avatares e contador em tempo real
 */
export function inicializarPresencaDoRole(roleIdAtual = "role_padrao") {
    const btnVouColar = document.getElementById("btn-vou-colar");
    const lblTotal = document.getElementById("lbl-total-confirmados");
    const containerAvatares = document.getElementById("mini-avatares-confirmados");

    const roleTitulo = document.getElementById("role-titulo");
    const roleData = document.getElementById("role-data");
    const roleLocal = document.getElementById("role-local");

    if (!btnVouColar || !lblTotal) return;

    let dadosRole = null;
    const roleRef = doc(db, "roles", roleIdAtual);

    // 📡 ESCUTA EM TEMPO REAL DO EVENTO NO FIRESTORE
    const unsubscribe = onSnapshot(roleRef, async (docSnap) => {
        if (!docSnap.exists()) {
            dadosRole = {
                titulo: "Resenha dos Fundadores 🥤🍕",
                data_hora: "Sábado, 17/10 às 20:00h",
                local: "Praça dos Girassóis",
                confirmados: [],
                confirmados_detalhes: []
            };
            try {
                await setDoc(roleRef, dadosRole);
            } catch (err) {
                console.warn("[Roles] Aviso ao criar role inicial:", err);
            }
        } else {
            dadosRole = docSnap.data();
        }

        const listaConfirmados = dadosRole.confirmados || [];
        const confirmadosDetalhes = dadosRole.confirmados_detalhes || [];
        const meuUID = auth?.currentUser?.uid || localStorage.getItem("tribbus_user_session");

        // Atualiza textos do card se existirem no banco
        if (roleTitulo && dadosRole.titulo) roleTitulo.textContent = dadosRole.titulo;
        if (roleData && dadosRole.data_hora) {
            roleData.innerHTML = `<i class="far fa-clock"></i> ${dadosRole.data_hora}`;
        }
        if (roleLocal && dadosRole.local) {
            roleLocal.innerHTML = `<i class="fas fa-map-marked-alt"></i> Local: ${dadosRole.local}`;
        }

        // Atualiza a contagem bruta na tela
        lblTotal.innerText = listaConfirmados.length;

        // Se eu já cliquei antes, o botão ganha estilo cinza com borda ciano de "Confirmado"
        if (meuUID && listaConfirmados.includes(meuUID)) {
            btnVouColar.style.background = "var(--cinza-input, #18181b)";
            btnVouColar.style.border = "1px solid var(--ciano-neon, #00F0FF)";
            btnVouColar.style.color = "#FFFFFF";
            btnVouColar.innerHTML = `<i class="fas fa-check-circle" style="color: var(--ciano-neon, #00F0FF)"></i> Presença Confirmada!`;
        } else {
            // Se eu não cliquei, volta a ser o botão rosa original
            btnVouColar.style.background = "var(--gradient-supremo, linear-gradient(135deg, #FF007F 0%, #9400D3 50%, #00F0FF 100%))";
            btnVouColar.style.border = "none";
            btnVouColar.style.color = "#FFFFFF";
            btnVouColar.innerHTML = `<i class="fas fa-rocket"></i> Vou Colar!`;
        }

        // Renderiza mini-avatares dos confirmados
        if (containerAvatares) {
            if (listaConfirmados.length === 0) {
                containerAvatares.innerHTML = `<span style="color: var(--texto-suave, #9AA0A6); font-size: 0.72rem; font-style: italic;">Bora ser o 1º!</span>`;
            } else {
                const maxExibir = 5;
                const visiveis = confirmadosDetalhes.slice(0, maxExibir);
                const restantes = listaConfirmados.length - visiveis.length;

                let htmlAvatares = "";
                visiveis.forEach((membro, index) => {
                    const avatarUrl = membro.avatar_url || "";
                    const nome = membro.nome || "Membro";
                    const margemEsq = index === 0 ? "0" : "-10px";

                    if (avatarUrl) {
                        htmlAvatares += `
                            <img src="${escapeAttr(avatarUrl)}" alt="${escapeAttr(nome)}" title="${escapeAttr(nome)}" 
                                 style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 2px solid #121214; margin-left: ${margemEsq}; box-shadow: 0 0 6px rgba(0, 240, 255, 0.4); background: #1F1C33;"
                                 onerror="this.src=''; this.style.display='none';" />
                        `;
                    } else {
                        htmlAvatares += `
                            <div title="${escapeAttr(nome)}" style="width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #FF007F, #00F0FF); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #FFF; font-weight: bold; border: 2px solid #121214; margin-left: ${margemEsq}; box-shadow: 0 0 6px rgba(255, 0, 127, 0.4);">
                                ${escapeAttr(nome.charAt(0).toUpperCase())}
                            </div>
                        `;
                    }
                });

                if (restantes > 0) {
                    htmlAvatares += `
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 0.6rem; color: #FFF; font-weight: bold; border: 2px solid #121214; margin-left: -8px;">
                            +${restantes}
                        </div>
                    `;
                }

                containerAvatares.innerHTML = htmlAvatares;
            }
        }
    });

    // 👆 CLIQUE NO BOTÃO: Adiciona ou remove a presença no array
    btnVouColar.onclick = async () => {
        const meuUID = auth?.currentUser?.uid || localStorage.getItem("tribbus_user_session");
        if (!meuUID) {
            alert("⚠️ Conecte-se na sua órbita para colar no rolê!");
            return;
        }

        btnVouColar.disabled = true;

        try {
            const listaConfirmados = dadosRole?.confirmados || [];
            const confirmadosDetalhes = dadosRole?.confirmados_detalhes || [];
            const jaConfirmou = listaConfirmados.includes(meuUID);

            // Obtém dados atuais do usuário para os mini-avatares
            let meuNome = auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Membro";
            let meuAvatar = auth.currentUser?.photoURL || localStorage.getItem("tribbus_user_avatar_url") || "";

            try {
                const userDoc = await getDoc(doc(db, "usuarios", meuUID));
                if (userDoc.exists()) {
                    const uData = userDoc.data();
                    if (uData.nome) meuNome = uData.nome;
                    if (uData.avatar_url) meuAvatar = uData.avatar_url;
                }
            } catch {}

            const meuRegistro = { uid: meuUID, nome: meuNome, avatar_url: meuAvatar };

            if (jaConfirmou) {
                // Remove a presença (alternância Union / Remove)
                const novosDetalhes = confirmadosDetalhes.filter(m => m.uid !== meuUID);
                await updateDoc(roleRef, {
                    confirmados: arrayRemove(meuUID),
                    confirmados_detalhes: novosDetalhes
                });
            } else {
                // Adiciona presença
                const novosDetalhes = [...confirmadosDetalhes.filter(m => m.uid !== meuUID), meuRegistro];
                await updateDoc(roleRef, {
                    confirmados: arrayUnion(meuUID),
                    confirmados_detalhes: novosDetalhes
                });
            }
        } catch (error) {
            console.error("Erro ao atualizar presença no rolê:", error);
            alert("⚠️ Não foi possível registrar sua presença no momento.");
        } finally {
            btnVouColar.disabled = false;
        }
    };

    // Revalida botão quando estado do auth alterar
    onAuthStateChanged(auth, () => {
        if (dadosRole) {
            const listaConfirmados = dadosRole.confirmados || [];
            const meuUID = auth?.currentUser?.uid;
            if (meuUID && listaConfirmados.includes(meuUID)) {
                btnVouColar.style.background = "var(--cinza-input, #18181b)";
                btnVouColar.style.border = "1px solid var(--ciano-neon, #00F0FF)";
                btnVouColar.style.color = "#FFFFFF";
                btnVouColar.innerHTML = `<i class="fas fa-check-circle" style="color: var(--ciano-neon, #00F0FF)"></i> Presença Confirmada!`;
            } else {
                btnVouColar.style.background = "var(--gradient-supremo, linear-gradient(135deg, #FF007F 0%, #9400D3 50%, #00F0FF 100%))";
                btnVouColar.style.border = "none";
                btnVouColar.style.color = "#FFFFFF";
                btnVouColar.innerHTML = `<i class="fas fa-rocket"></i> Vou Colar!`;
            }
        }
    });

    return unsubscribe;
}

// Compatibilidade
export function inicializarRolesTribu(triboId = "tribo_oficial") {
    return inicializarPresencaDoRole(triboId);
}

function escapeAttr(str) {
    if (!str) return "";
    return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
