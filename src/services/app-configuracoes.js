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
    const inputUploadAvatar = document.getElementById("input-upload-avatar");
    const lblStatusAvatar = document.getElementById("lbl-status-avatar");
    const inputUploadCapa = document.getElementById("input-upload-capa");
    const lblStatusCapa = document.getElementById("lbl-status-capa");
    const rangePosicao = document.getElementById("range-posicao-capa");
    const imgPrevia = document.getElementById("img-previa-capa-dinamica");
    const txtPorcentagem = document.getElementById("txt-posicao-porcentagem");
    const inputCapa = document.getElementById("input-upload-capa");
    const txtLegendaPrevia = document.getElementById("txt-legenda-previa-capa");

    let posicaoYEscolhida = "0%";

    // 🔄 1. Atualiza o espelho visual da foto de capa em tempo real nas configurações
    if (rangePosicao && imgPrevia && txtPorcentagem) {
        rangePosicao.oninput = () => {
            posicaoYEscolhida = `${rangePosicao.value}%`;
            txtPorcentagem.innerText = posicaoYEscolhida;
            imgPrevia.style.backgroundPosition = `center ${posicaoYEscolhida}`;
        };
    }

    // 🔄 2. Troca a imagem da prévia assim que o usuário seleciona um arquivo novo
    if (inputCapa && imgPrevia) {
        inputCapa.onchange = (e) => {
            if (!e.target.files || e.target.files.length === 0) return;
            const urlTemporaria = URL.createObjectURL(e.target.files[0]);
            imgPrevia.style.backgroundImage = `url('${urlTemporaria}')`;
            imgPrevia.style.opacity = "1";
            if (txtLegendaPrevia) txtLegendaPrevia.style.display = "none";
        };
    }

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

    if (inputUploadAvatar && lblStatusAvatar) {
        inputUploadAvatar.addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            if (file) {
                lblStatusAvatar.innerHTML = `<span style="color: var(--ciano-neon);"><i class="fas fa-user-check"></i> Foto de perfil: <b>${file.name}</b></span>`;
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
            if (dados.foto_capa_url) {
                if (lblStatusCapa) {
                    lblStatusCapa.innerHTML = `<span style="color: #00FF7F;"><i class="fas fa-check-circle"></i> Foto de capa já configurada!</span>`;
                }
                if (imgPrevia) {
                    imgPrevia.style.backgroundImage = `url('${dados.foto_capa_url}')`;
                    imgPrevia.style.opacity = "1";
                    if (txtLegendaPrevia) txtLegendaPrevia.style.display = "none";
                }
            }

            const posicaoCarregada = dados.capa_posicao_y || (typeof dados.foto_capa_posicao === "number" ? `${dados.foto_capa_posicao}%` : null);
            if (posicaoCarregada) {
                posicaoYEscolhida = posicaoCarregada.includes("%") ? posicaoCarregada : `${posicaoCarregada}%`;
                const valorNum = parseInt(posicaoYEscolhida, 10) || 0;
                if (rangePosicao) rangePosicao.value = valorNum;
                if (txtPorcentagem) txtPorcentagem.textContent = posicaoYEscolhida;
                if (imgPrevia) {
                    imgPrevia.style.backgroundPosition = `center ${posicaoYEscolhida}`;
                }
            }

            // Dados Pessoais
            if (inputCidadeAtual && dados.cidade_atual) inputCidadeAtual.value = dados.cidade_atual;
            if (inputCidadeNatal && dados.cidade_natal) inputCidadeNatal.value = dados.cidade_natal;
            if (inputDataNascimento && (dados.data_nascimento || dados.aniversario)) {
                inputDataNascimento.value = dados.data_nascimento || dados.aniversario;
            }
            if (selectEstadoCivil && dados.estado_civil) selectEstadoCivil.value = dados.estado_civil;
            if (selectSexo && dados.sexo) selectSexo.value = dados.sexo;
            
            // Valida na carga se o perfil já possuir data
            if (inputDataNascimento?.value) {
                validarIdadeMinima(inputDataNascimento.value);
            }
        }
    });

    /**
     * 🛡️ Validação de Idade Mínima (13 Anos)
     */
    function validarIdadeMinima(dataString) {
        const alertaIdade = document.getElementById("alerta-idade-vibe");
        if (!dataString) {
            if (alertaIdade) alertaIdade.style.display = "none";
            if (inputDataNascimento) {
                inputDataNascimento.style.borderColor = "rgba(255,255,255,0.1)";
                inputDataNascimento.style.boxShadow = "none";
            }
            return true;
        }

        const dataNasc = new Date(dataString);
        const hoje = new Date();

        if (isNaN(dataNasc.getTime())) {
            return true;
        }

        // Calcula a idade exata considerando dia e mês
        let idade = hoje.getFullYear() - dataNasc.getFullYear();
        const diferencaMes = hoje.getMonth() - dataNasc.getMonth();
        if (diferencaMes < 0 || (diferencaMes === 0 && hoje.getDate() < dataNasc.getDate())) {
            idade--;
        }

        if (idade < 13 || dataNasc > hoje) {
            if (alertaIdade) alertaIdade.style.display = "block";
            if (inputDataNascimento) {
                inputDataNascimento.style.borderColor = "#FF007F";
                inputDataNascimento.style.boxShadow = "0 0 10px rgba(255, 0, 127, 0.4)";
            }
            return false;
        } else {
            if (alertaIdade) alertaIdade.style.display = "none";
            if (inputDataNascimento) {
                inputDataNascimento.style.borderColor = "rgba(0, 240, 255, 0.4)";
                inputDataNascimento.style.boxShadow = "0 0 8px rgba(0, 240, 255, 0.2)";
            }
            return true;
        }
    }

    if (inputDataNascimento) {
        inputDataNascimento.addEventListener("input", (e) => validarIdadeMinima(e.target.value));
        inputDataNascimento.addEventListener("change", (e) => validarIdadeMinima(e.target.value));
    }

    form.onsubmit = async (e) => {
        e.preventDefault();

        // 🛡️ Bloqueio rigoroso de menores de 13 anos
        const dataNascInputVal = inputDataNascimento?.value || "";
        if (dataNascInputVal && !validarIdadeMinima(dataNascInputVal)) {
            inputDataNascimento?.focus();
            return;
        }

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
            
            const arquivoAvatar = document.getElementById("input-upload-avatar")?.files?.[0];
            const arquivoCapa = document.getElementById("input-upload-capa")?.files?.[0];
            let avatarUrlFinal = null;
            let capaUrlFinal = null;

            // 👤 SE O USUÁRIO SELECIONOU UMA FOTO DE PERFIL REAL
            if (arquivoAvatar) {
                console.log("Subindo foto de perfil para as nuvens...");
                try {
                    const avatarRef = ref(storage, `avatares_usuarios/${meuUID}_avatar.png`);
                    await uploadBytes(avatarRef, arquivoAvatar);
                    avatarUrlFinal = await getDownloadURL(avatarRef);
                } catch (storageErr) {
                    console.warn("Storage direto indisponível para avatar, usando fallback:", storageErr);
                    avatarUrlFinal = await fazerUploadDeFoto(arquivoAvatar);
                }
            }

            // 🖼️ SE O USUÁRIO SELECIONOU UMA FOTO DE CAPA REAL, FAZ O UPLOAD NO STORAGE
            if (arquivoCapa) {
                console.log("Detectada nova foto de capa! Iniciando decolagem para o Storage...");
                try {
                    // Referência oficial na pasta de capas de perfil
                    const capaRef = ref(storage, `capas_perfis/capa_${meuUID}.png`);
                    await uploadBytes(capaRef, arquivoCapa);
                    capaUrlFinal = await getDownloadURL(capaRef);
                } catch (storageErr) {
                    console.warn("Storage direto indisponível, usando fallback otimizado:", storageErr);
                    capaUrlFinal = await fazerUploadDeFoto(arquivoCapa);
                }
            }

            // Posição de alinhamento vertical da capa
            const posicaoCapaValor = rangePosicaoCapa ? Number(rangePosicaoCapa.value) : 50;

            // Monte o documento com as chaves exatas e unificadas que o perfil vai ler
            const dadosAtualizados = {
                nome: nomeInput || "Membro da Tribu",
                frase_status: statusInput || "🪐 em órbita...",
                
                // 🔥 NOVAS CHAVES DE DADOS PESSOAIS UNIFICADAS
                cidade_atual: cidadeAtualInput || "Não informado",
                cidade_natal: cidadeNatalInput || "Não informado",
                data_nascimento: dataNascInput || "",
                estado_civil: estadoCivilInput || "Solteiro(a)",
                sexo: sexoInput || "Não informado",
                capa_posicao_y: posicaoYEscolhida || "0%",
                foto_capa_posicao: parseInt(posicaoYEscolhida, 10) || 0,
                ultima_atualizacao: new Date().toISOString()
            };

            // Se um novo avatar foi processado, anexa ao documento e atualiza cache local
            if (avatarUrlFinal) {
                dadosAtualizados.avatar_url = avatarUrlFinal;
                localStorage.setItem("tribbus_user_avatar_url", avatarUrlFinal);
            }

            // Se uma nova capa foi processada, anexa ao documento e salva em foto_capa_url
            if (capaUrlFinal) {
                dadosAtualizados.foto_capa_url = capaUrlFinal;
            }

            // Atualiza direto no Firestore (setDoc com merge para garantir persistência)
            const usuarioRef = doc(db, "usuarios", meuUID);
            await setDoc(usuarioRef, dadosAtualizados, { merge: true });
            
            alert("🎉 Sucesso! Suas configurações foram salvas no universo do Tribbu'sVibe!");
            window.location.href = "perfil.html";

        } catch (error) {
            console.error("Erro crítico ao salvar configurações:", error);
            alert(`⚠️ Erro ao salvar dados no Firebase: ${error.message}`);
        } finally {
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.textContent = "Salvar Configurações";
            }
        }
    };

    inicializarBotaoExcluirConta();
}

export function inicializarFormularioConfiguracoes() {
    configurarFormularioSalvar();
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
