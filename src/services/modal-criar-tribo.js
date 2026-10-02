// 🪐 Tribbu'sVibe - Modal Direto de Fundar Nova Tribu
// Arquivo: modal-criar-tribo.js

import { auth, db } from "./tribbusFirebase.js";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { redimensionarEComprimirImagem } from "./firebase-storage.js";

export function inicializarModalCriarTribo() {
    const modal = document.getElementById("modal-criar-tribu-direto");
    const btnFechar = document.getElementById("btn-fechar-modal-criar-tribu");
    const form = document.getElementById("form-criar-tribu-direto");
    const btnLancar = document.getElementById("btn-lancar-tribu-direto");
    const inputFoto = document.getElementById("file-capa-tribu-direto");
    const previewCapa = document.getElementById("preview-capa-tribu-direto");

    if (!modal) return;

    let capaProcessadaBase64 = "";

    // 📸 Pré-visualização e compressão da capa selecionada
    if (inputFoto) {
        inputFoto.addEventListener("change", async (e) => {
            const arquivo = e.target.files?.[0];
            if (!arquivo) return;

            try {
                const base64Comprimida = await redimensionarEComprimirImagem(arquivo, 1080, 0.75);
                capaProcessadaBase64 = base64Comprimida;
                if (previewCapa) {
                    previewCapa.src = base64Comprimida;
                    previewCapa.style.display = "block";
                }
            } catch (err) {
                console.warn("[CriarTribo] Erro na compressão da imagem:", err);
            }
        });
    }

    // 🚪 Fechar Modal
    function fecharModal() {
        modal.style.display = "none";
        if (form) form.reset();
        capaProcessadaBase64 = "";
        if (previewCapa) previewCapa.style.display = "none";
    }

    if (btnFechar) btnFechar.addEventListener("click", fecharModal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) fecharModal();
    });

    // 🚀 Lançar Tribu no Banco de Dados
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const usuarioAtual = auth?.currentUser;
            const meuUID = usuarioAtual?.uid || localStorage.getItem("tribbus_user_session") || "membro_" + Date.now();
            const meuNome = usuarioAtual?.displayName || localStorage.getItem("tribbus_user_nome") || "Fundador";

            const nomeTribu = document.getElementById("input-nome-tribu-direto")?.value?.trim();
            const descTribu = document.getElementById("txt-descricao-tribu-direto")?.value?.trim();
            const categoriaTribu = document.getElementById("select-categoria-tribu-direto")?.value || "Geral";

            if (!nomeTribu || !descTribu) {
                alert("⚠️ Por favor, preencha o Nome e o Manifesto da sua Tribu!");
                return;
            }

            btnLancar.disabled = true;
            btnLancar.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Fundando Tribu...`;

            try {
                const payloadTribo = {
                    nome: nomeTribu,
                    descricao: descTribu,
                    categoria: categoriaTribu,
                    capa_url: capaProcessadaBase64 || "",
                    emblema: "🪐",
                    criador_uid: meuUID,
                    criador_nome: meuNome,
                    membros_contador: 1,
                    membros: [meuUID],
                    data_criacao: new Date().toISOString()
                };

                // Grava na coleção 'tribos'
                const docRef = await addDoc(collection(db, "tribos"), payloadTribo);

                // Também espelha em 'comunidades' para compatibilidade total de tópicos e fórum
                try {
                    await setDoc(doc(db, "comunidades", docRef.id), {
                        id: docRef.id,
                        ...payloadTribo
                    });
                } catch (eEspelho) {
                    console.warn("[CriarTribo] Aviso no espelho de comunidades:", eEspelho);
                }

                alert(`🎉 Vitória! A Tribu "${nomeTribu}" foi fundada no Universo Tribbu'sVibe!`);
                fecharModal();

                // Navega direto para a página da Tribu recém-criada
                window.location.href = `tribos.html?id=${docRef.id}`;
            } catch (err) {
                console.error("[CriarTribo] Erro ao fundar:", err);
                alert("❌ Erro ao fundar a Tribu. Verifique sua conexão e tente novamente.");
            } finally {
                btnLancar.disabled = false;
                btnLancar.innerHTML = `<i class="fas fa-meteor"></i> Lançar no Universo`;
            }
        });
    }

    // Vincula a abertura do modal aos botões de fundar tribo
    window.abrirModalCriarTribo = function() {
        modal.style.display = "flex";
        const inputNome = document.getElementById("input-nome-tribu-direto");
        if (inputNome) setTimeout(() => inputNome.focus(), 100);
    };

    const botoesFundar = document.querySelectorAll(".btn-abrir-modal-fundar-tribu");
    botoesFundar.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            window.abrirModalCriarTribo();
        });
    });
}

// Auto-inicialização
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarModalCriarTribo);
    } else {
        setTimeout(inicializarModalCriarTribo, 50);
    }
}
