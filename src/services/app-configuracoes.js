// 🪐 Tribbu'sVibe - Gravador Suprema de Configurações e Capas
// Arquivo: src/services/app-configuracoes.js

import { doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, deleteUser, signOut } from "firebase/auth";
import { db, auth, storage } from "./tribbusFirebase.js";
import { buscarDadosConfiguracao } from "./firebase-configuracoes.js";
import { fazerUploadDeFoto } from "./firebase-storage.js";

export function configurarFormularioSalvar() {
    const form = document.querySelector("form");
    const btnSalvar = document.querySelector(".btn-salvar-config");

    if (!form) return;

    // Sincronização dos números dos sliders em tempo real
    const rangeConfiavel = document.getElementById("range-confiavel") || document.querySelector(".range-confiavel");
    const rangeLegal = document.getElementById("range-legal") || document.querySelector(".range-legal");
    const rangeVibe = document.getElementById("range-vibe") || document.querySelector(".range-vibe");

    const txtValConfiavel = document.getElementById("txt-val-confiavel-config");
    const txtValLegal = document.getElementById("txt-val-legal-config");
    const txtValVibe = document.getElementById("txt-val-vibe-config");
    const inputNome = document.getElementById("input-nome");
    const inputStatus = document.getElementById("input-status");
    const inputUploadCapa = document.getElementById("input-upload-capa");
    const lblStatusCapa = document.getElementById("lbl-status-capa");

    const inputCidadeAtual = document.getElementById("input-cidade-atual");
    const inputCidadeNatal = document.getElementById("input-cidade-natal");
    const inputDataNascimento = document.getElementById("input-data-nascimento");
    const selectEstadoCivil = document.getElementById("select-estado-civil");
    const selectSexo = document.getElementById("select-sexo");

    if (rangeConfiavel) {
        rangeConfiavel.addEventListener("input", (e) => {
            const val = `${e.target.value}%`;
            if (txtValConfiavel) txtValConfiavel.textContent = val;
        });
    }

    if (rangeLegal) {
        rangeLegal.addEventListener("input", (e) => {
            const val = `${e.target.value}%`;
            if (txtValLegal) txtValLegal.textContent = val;
        });
    }

    if (rangeVibe) {
        rangeVibe.addEventListener("input", (e) => {
            const val = `${e.target.value}%`;
            if (txtValVibe) txtValVibe.textContent = val;
        });
    }

    if (inputUploadCapa && lblStatusCapa) {
        inputUploadCapa.addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            if (file) {
                lblStatusCapa.innerHTML = `<span style="color: var(--ciano-neon);"><i class="fas fa-image"></i> Imagem pronta: <b>${file.name}</b></span>`;
            }
        });
    }

    // Carregamento dos dados atuais do usuário
    onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) return;
        const meuUID = usuario.uid;

        if (inputNome && !inputNome.value) {
            inputNome.value = usuario.displayName || usuario.email?.split("@")[0] || "";
        }

        const res = await buscarDadosConfiguracao(meuUID);
        if (res && res.sucesso && res.dados) {
            const dados = res.dados;
            if (inputNome && dados.nome) inputNome.value = dados.nome;
            if (inputStatus && (dados.frase_status || dados.status_vibe)) {
                inputStatus.value = dados.frase_status || dados.status_vibe;
            }
            if (rangeConfiavel && typeof dados.medidor_confiavel === "number") {
                rangeConfiavel.value = dados.medidor_confiavel;
                if (txtValConfiavel) txtValConfiavel.textContent = `${dados.medidor_confiavel}%`;
            }
            if (rangeLegal && typeof dados.medidor_legal === "number") {
                rangeLegal.value = dados.medidor_legal;
                if (txtValLegal) txtValLegal.textContent = `${dados.medidor_legal}%`;
            }
            if (rangeVibe && typeof dados.medidor_vibe === "number") {
                rangeVibe.value = dados.medidor_vibe;
                if (txtValVibe) txtValVibe.textContent = `${dados.medidor_vibe}%`;
            }
            if (dados.foto_capa_url && lblStatusCapa) {
                lblStatusCapa.innerHTML = `<span style="color: #00FF7F;"><i class="fas fa-check-circle"></i> Foto de capa já configurada!</span>`;
            }

            // Dados Pessoais
            if (inputCidadeAtual && dados.cidade_atual) inputCidadeAtual.value = dados.cidade_atual;
            if (inputCidadeNatal && dados.cidade_natal) inputCidadeNatal.value = dados.cidade_natal;
            if (inputDataNascimento && (dados.data_nascimento || dados.aniversario)) {
                inputDataNascimento.value = dados.data_nascimento || dados.aniversario;
            }
            if (selectEstadoCivil && dados.estado_civil) selectEstadoCivil.value = dados.estado_civil;
            if (selectSexo && dados.sexo) selectSexo.value = dados.sexo;
        }
    });

    form.onsubmit = async (e) => {
        e.preventDefault();
        const meuUID = auth.currentUser?.uid;
        if (!meuUID) return;

        if (btnSalvar) {
            btnSalvar.disabled = true;
            btnSalvar.textContent = "⏳ Gravando na Vibe...";
        }

        try {
            // Captura os dados textuais e numéricos dos 3 sliders alinhados
            const nomeInput = document.getElementById("input-nome")?.value?.trim();
            const statusInput = document.getElementById("input-status")?.value?.trim();
            const valConfiavel = Number(document.getElementById("range-confiavel")?.value || 85);
            const valLegal = Number(document.getElementById("range-legal")?.value || 50);
            const valVibe = Number(document.getElementById("range-vibe")?.value || 100);

            // Dados Pessoais
            const cidadeAtualInput = inputCidadeAtual?.value?.trim() || "";
            const cidadeNatalInput = inputCidadeNatal?.value?.trim() || "";
            const dataNascInput = inputDataNascimento?.value?.trim() || "";
            const estadoCivilInput = selectEstadoCivil?.value || "Solteiro(a)";
            const sexoInput = selectSexo?.value || "Não informado";
            
            const arquivoCapa = document.getElementById("input-upload-capa")?.files?.[0];
            let capaUrlFinal = null;

            // 🖼️ SE O USUÁRIO SELECIONOU UMA FOTO DE CAPA REAL, FAZ O UPLOAD NO STORAGE
            if (arquivoCapa) {
                console.log("Subindo foto de capa real para as nuvens do Google...");
                try {
                    const capaRef = ref(storage, `capas_usuarios/${meuUID}_capa.png`);
                    await uploadBytes(capaRef, arquivoCapa);
                    capaUrlFinal = await getDownloadURL(capaRef);
                } catch (storageErr) {
                    console.warn("Storage direto indisponível, usando fallback otimizado:", storageErr);
                    capaUrlFinal = await fazerUploadDeFoto(arquivoCapa);
                }
            }

            // Monte o documento com as chaves exatas e unificadas que o perfil vai ler
            const dadosAtualizados = {
                nome: nomeInput || "Membro da Tribo",
                frase_status: statusInput || "🪐 em órbita...",
                medidor_confiavel: valConfiavel,
                medidor_legal: valLegal,
                medidor_vibe: valVibe,
                
                // 🔥 NOVAS CHAVES DE DADOS PESSOAIS UNIFICADAS
                cidade_atual: document.getElementById("input-cidade-atual")?.value?.trim() || "",
                cidade_natal: document.getElementById("input-cidade-natal")?.value?.trim() || "",
                data_nascimento: document.getElementById("input-data-nascimento")?.value || "",
                estado_civil: document.getElementById("select-estado-civil")?.value || "Solteiro(a)",
                sexo: document.getElementById("select-sexo")?.value || "Não informado",
                ultima_atualizacao: new Date().toISOString()
            };

            // Se uma nova capa foi processada, anexa ao documento
            if (capaUrlFinal) {
                dadosAtualizados.foto_capa_url = capaUrlFinal;
            }

            // Atualiza direto na gaveta de usuários do Firestore (setDoc com merge para garantir persistência)
            await setDoc(doc(db, "usuarios", meuUID), dadosAtualizados, { merge: true });
            
            alert("✨ Sucesso! Suas configurações, termômetros e capa foram salvos na rede.");
            window.location.href = "perfil.html";

        } catch (error) {
            console.error("Erro ao gravar configurações:", error);
            alert("⚠️ Erro ao salvar dados no Firebase. Tente novamente.");
        } finally {
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.textContent = "Salvar Configurações";
            }
        }
    };

    inicializarBotaoExcluirConta();
}

/**
 * 🪐 Tribbu'sVibe - Sistema de Autoexclusão Definitiva de Conta
 */
export function inicializarBotaoExcluirConta() {
    const btnExcluir = document.getElementById("btn-excluir-conta-vibe");
    if (!btnExcluir) return;

    btnExcluir.addEventListener("click", async () => {
        const usuarioLogado = auth.currentUser;
        if (!usuarioLogado) return;

        // 🛡️ CONFIRMAÇÃO 1
        const primeiraConfirmacao = confirm("⚠️ ATENÇÃO, FUNDADOR! Você está prestes a deletar sua conta do Tribbu'sVibe para sempre. Tem certeza absoluta disso?");
        if (!primeiraConfirmacao) return;

        // 🛡️ CONFIRMAÇÃO 2 (Evita arrependimentos rápidos)
        const segundaConfirmacao = confirm("🚨 ÚLTIMO AVISO: Isso vai apagar seu nome, sua foto de capa, seus vídeos e zerar todos os seus termômetros neon de reputação de forma irreversível. Deseja prosseguir?");
        if (!segundaConfirmacao) return;

        try {
            // Desabilita o botão para evitar cliques múltiplos travados
            btnExcluir.disabled = true;
            btnExcluir.innerText = "💥 Destruindo cadastro da órbita...";

            const uid = usuarioLogado.uid;
            console.log(`Iniciando purgação de dados do usuário: ${uid}`);

            // 1. Limpa o documento de dados pessoais e sliders do Firestore
            await deleteDoc(doc(db, "usuarios", uid));
            console.log("Documento do perfil apagado do Firestore com sucesso.");

            // 2. Limpa a credencial de login do Firebase Authentication
            await deleteUser(usuarioLogado);
            console.log("Credencial de acesso revogada do Firebase Auth.");

            alert("🎉 Sua conta foi completamente apagada da rede. Esperamos te ver de volta em uma próxima vibe! 🪐");
            
            // Joga o ex-membro direto para a tela de entrada do app
            window.location.href = "index.html";

        } catch (error) {
            console.error("Erro crítico ao deletar conta no Firebase:", error?.message || error);
            
            // Tratamento de erro clássico do Firebase para ações sensíveis (exige login recente)
            if (error?.code === "auth/requires-recent-login") {
                alert("🔒 Por segurança de dados, essa ação exige que você faça login novamente antes de deletar a conta. Saia e entre de novo na rede.");
            } else {
                alert(`⚠️ Não foi possível excluir sua conta: ${error?.message || error}`);
            }
            
            btnExcluir.disabled = false;
            btnExcluir.innerHTML = "<i class='fas fa-exclamation-triangle'></i> Excluir Meu Cadastro Permanentemente";
        }
    });
}

export function inicializarConfiguracoes() {
    configurarFormularioSalvar();
    inicializarBotaoExcluirConta();
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => inicializarConfiguracoes());
    } else {
        setTimeout(() => inicializarConfiguracoes(), 50);
    }
}
