// 🪐 Tribbu'sVibe - Encanamento da Tela de Configurações
// Arquivo: app-configuracoes.js

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./tribbusFirebase.js";
import { buscarDadosConfiguracao, salvarConfiguracoesPerfil } from "./firebase-configuracoes.js";

/**
 * 🛠️ Inicializa os controles da tela de configurações e sincronização com o Firestore
 */
export function inicializarConfiguracoes() {
    const inputNome = document.getElementById("input-nome");
    const inputStatus = document.getElementById("input-status");
    const rangeConfiavel = document.querySelector(".range-confiavel");
    const rangeVibe = document.querySelector(".range-vibe");
    const form = document.querySelector("form");
    const btnSalvar = document.querySelector(".btn-salvar-config");

    // Sincroniza em tempo real os valores numéricos dos sliders
    document.querySelectorAll(".range-container").forEach((container) => {
        const slider = container.querySelector(".range-input");
        const valorTexto = container.querySelector(".range-valor");
        if (slider && valorTexto) {
            slider.addEventListener("input", (e) => {
                valorTexto.textContent = `${e.target.value}%`;
            });
        }
    });

    // 🔐 MONITOR DE AUTENTICAÇÃO: Carrega dados do usuário logado
    const unsubscribeAuth = onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            console.log("[Configurações] Usuário não logado, mantendo dados padrão.");
            return;
        }

        const meuUID = usuario.uid;

        // 📥 Pré-carrega dados salvos no Firestore
        const res = await buscarDadosConfiguracao(meuUID);
        if (res && res.sucesso && res.dados) {
            const dados = res.dados;
            if (inputNome && dados.nome) inputNome.value = dados.nome;
            if (inputStatus && dados.status_vibe) inputStatus.value = dados.status_vibe;

            if (rangeConfiavel && typeof dados.medidor_confiavel === "number") {
                rangeConfiavel.value = dados.medidor_confiavel;
                const container = rangeConfiavel.closest(".range-container");
                const valorSpan = container?.querySelector(".range-valor");
                if (valorSpan) valorSpan.textContent = `${dados.medidor_confiavel}%`;
            }

            if (rangeVibe && typeof dados.medidor_vibe === "number") {
                rangeVibe.value = dados.medidor_vibe;
                const container = rangeVibe.closest(".range-container");
                const valorSpan = container?.querySelector(".range-valor");
                if (valorSpan) valorSpan.textContent = `${dados.medidor_vibe}%`;
            }
        }

        // 💾 SALVAR CONFIGURAÇÕES NO CLIQUE / SUBMIT
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                
                const textoOriginal = btnSalvar ? btnSalvar.textContent : "Salvar";
                if (btnSalvar) {
                    btnSalvar.disabled = true;
                    btnSalvar.textContent = "⏳ Gravando na Vibe...";
                }

                const dadosAtualizados = {
                    nome: inputNome?.value?.trim() || "Membro da Tribo",
                    status_vibe: inputStatus?.value?.trim() || "🪐 em órbita...",
                    medidor_confiavel: rangeConfiavel ? Number(rangeConfiavel.value) : 85,
                    medidor_vibe: rangeVibe ? Number(rangeVibe.value) : 100
                };

                const resultado = await salvarConfiguracoesPerfil(meuUID, dadosAtualizados);

                if (btnSalvar) {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = textoOriginal;
                }

                if (resultado && resultado.sucesso) {
                    alert("✨ Sucesso! Suas configurações e termômetros foram salvos na rede.");
                    // Se o usuário desejar ir para o perfil conferir
                    if (window.confirm("Deseja ver seu perfil atualizado agora?")) {
                        window.location.href = "perfil.html";
                    }
                } else {
                    alert("⚠️ Não foi possível salvar no momento. Tente novamente.");
                }
            };
        }
    });

    return unsubscribeAuth;
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => inicializarConfiguracoes());
    } else {
        setTimeout(() => inicializarConfiguracoes(), 50);
    }
}
