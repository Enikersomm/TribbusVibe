// 🪐 Tribbu'sVibe - Central Suprema de Rolês Legítimos
// Arquivo: src/services/app-roles.js

import { collection, addDoc, doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./tribbusFirebase.js";

// 🔥 LINHA BLINDADA COM O EXPORT EXATO QUE O FÓRUM CAÇA:
export function configurarPainelDeCriacaoDeRoles(criadorUidDaTribu, tribuIdAtual) {
    const btnAbrir = document.getElementById("btn-abrir-painel-role");
    const gaveta = document.getElementById("gaveta-criar-role");
    const btnCancelar = document.getElementById("btn-cancelar-role");
    const formRole = document.getElementById("form-real-role");
    const btnSubmit = document.getElementById("btn-enviar-role-fb");
    
    const meuUID = auth?.currentUser?.uid || localStorage.getItem("tribbus_user_session");

    if (!btnAbrir || !gaveta || !formRole) return;

    // O botão de lançar rolê só fica visível se você for o dono da Tribu!
    const ehCriador = meuUID && (
        meuUID === criadorUidDaTribu ||
        criadorUidDaTribu === "oficial" ||
        !criadorUidDaTribu
    );

    if (ehCriador) {
        btnAbrir.style.display = "flex";
    } else {
        btnAbrir.style.display = "none";
    }

    btnAbrir.onclick = () => { gaveta.style.display = "block"; btnAbrir.style.display = "none"; };
    if (btnCancelar) {
        btnCancelar.onclick = () => { gaveta.style.display = "none"; btnAbrir.style.display = "flex"; };
    }

    formRole.onsubmit = async (e) => {
        e.preventDefault();

        const usuarioLogado = auth?.currentUser?.uid || localStorage.getItem("tribbus_user_session");
        const podeCriar = usuarioLogado && (
            usuarioLogado === criadorUidDaTribu ||
            criadorUidDaTribu === "oficial" ||
            !criadorUidDaTribu
        );

        if (!podeCriar) {
            alert("⚠️ Permissão negada!");
            return;
        }

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerText = "⏳ Disparando rolê...";
        }

        try {
            const titulo = document.getElementById("input-role-titulo")?.value.trim();
            const dataHora = document.getElementById("input-role-data")?.value.trim();
            const localizacao = document.getElementById("input-role-local")?.value.trim();

            const roleDocRef = doc(db, "roles", tribuIdAtual);
            await setDoc(roleDocRef, {
                tribu_id: tribuIdAtual,
                titulo: titulo,
                data_hora: dataHora,
                local: localizacao,
                confirmados: [],
                confirmados_detalhes: [],
                criador_uid: usuarioLogado,
                data_criacao: new Date().toISOString()
            }, { merge: true });

            alert("🎉 Rolê real lançado com sucesso!");
            formRole.reset();
            gaveta.style.display = "none";
            btnAbrir.style.display = "flex";

        } catch (err) {
            console.error("Erro ao gravar rolê:", err);
            alert("⚠️ Erro ao lançar rolê. Verifique a conexão.");
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Lançar no Universo";
            }
        }
    };
}

/**
 * 📡 Inicializa a Presença do Rolê (Coleção roles)
 * Com alternância (Union/Remove), avatares e contador em tempo real
 */
export function inicializarPresencaDoRole(roleIdAtual = "tribo_oficial") {
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
            roleData.innerHTML = `<i class="far fa-clock"></i> ${escapeHTML(dadosRole.data_hora)}`;
        }
        if (roleLocal && (dadosRole.local || dadosRole.localizacao)) {
            roleLocal.innerHTML = `<i class="fas fa-map-marked-alt"></i> Local: ${escapeHTML(dadosRole.local || dadosRole.localizacao)}`;
        }

        // 👥 Contador em tempo real
        lblTotal.textContent = String(listaConfirmados.length);

        // 🎨 Estilo dinâmico do botão (Rosa vs Cinza Neon)
        if (meuUID && listaConfirmados.includes(meuUID)) {
            btnVouColar.style.background = "var(--cinza-input, #18181b)";
            btnVouColar.style.border = "1px solid var(--ciano-neon, #00F0FF)";
            btnVouColar.style.color = "#FFFFFF";
            btnVouColar.style.boxShadow = "0 0 10px rgba(0, 240, 255, 0.25)";
            btnVouColar.innerHTML = `<i class="fas fa-check-circle" style="color: var(--ciano-neon, #00F0FF)"></i> Presença Confirmada!`;
        } else {
            btnVouColar.style.background = "var(--gradient-supremo, linear-gradient(135deg, #FF007F 0%, #9400D3 50%, #00F0FF 100%))";
            btnVouColar.style.border = "none";
            btnVouColar.style.color = "#FFFFFF";
            btnVouColar.style.boxShadow = "0 4px 12px rgba(255, 0, 127, 0.25)";
            btnVouColar.innerHTML = `<i class="fas fa-rocket"></i> Vou Colar!`;
        }

        // 🖼️ Montagem dos Mini-Avatares Sobrepostos
        if (containerAvatares) {
            containerAvatares.innerHTML = "";
            const limiteExibicao = 4;
            const exibidos = confirmadosDetalhes.slice(0, limiteExibicao);
            const restantes = listaConfirmados.length - exibidos.length;

            let htmlAvatares = "";
            exibidos.forEach((membro, index) => {
                const zIndex = 10 - index;
                const margem = index === 0 ? "0px" : "-8px";
                const avatar = membro.avatar_url;
                const nome = membro.nome || "Membro";

                if (avatar && (avatar.startsWith("http") || avatar.startsWith("data:image"))) {
                    htmlAvatares += `
                        <img src="${escapeAttr(avatar)}" title="${escapeAttr(nome)}" 
                             style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 2px solid #121214; margin-left: ${margem}; z-index: ${zIndex};" 
                             onerror="this.style.display='none'" />
                    `;
                } else {
                    htmlAvatares += `
                        <div title="${escapeAttr(nome)}" style="width: 24px; height: 24px; border-radius: 50%; background: var(--cinza-input, #18181b); border: 2px solid #121214; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; margin-left: ${margem}; z-index: ${zIndex};">
                            👤
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
                const novosDetalhes = confirmadosDetalhes.filter(m => m.uid !== meuUID);
                await updateDoc(roleRef, {
                    confirmados: arrayRemove(meuUID),
                    confirmados_detalhes: novosDetalhes
                });
            } else {
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

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str) {
    if (!str) return "";
    return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
