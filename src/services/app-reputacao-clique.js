// 🪐 Tribbu'sVibe - Ativador dos Cliques de Votação nos Termômetros
// Arquivo: src/services/app-reputacao-clique.js

import { votarNoTermometroAmigo } from "./firebase-reputacao.js";
import { auth } from "./tribbusFirebase.js";

export function inicializarCliquesDeVotacao(alvoUidOverride) {
    const botoesVoto = document.querySelectorAll(".btn-voto-neon");
    
    if (!botoesVoto || botoesVoto.length === 0) return;

    // Detecta se há parâmetro ?uid= na URL para perfis de amigos visitados
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const uidDaPagina = urlParams ? urlParams.get("uid") : null;

    botoesVoto.forEach((botao) => {
        botao.addEventListener("click", async () => {
            const eleitorUid = auth?.currentUser?.uid;
            
            // ID do dono do perfil (Usa o parâmetro da página, o override ou o usuário atual)
            const alvoUid = alvoUidOverride || uidDaPagina || eleitorUid; 

            if (!eleitorUid || !alvoUid) {
                alert("⚠️ Ops! Você precisa estar logado para votar na vibe.");
                return;
            }

            const tipoTermometro = botao.getAttribute("data-termometro"); // medidor_confiavel, medidor_legal ou medidor_vibe
            if (!tipoTermometro) return;

            // Desabilita temporariamente para evitar cliques duplos e travar o Firebase
            botao.disabled = true;
            const textoOriginal = botao.innerText;
            botao.innerText = "⏳ Computando...";

            console.log(`Disparando voto manual no termômetro [${tipoTermometro}]...`);
            const resultado = await votarNoTermometroAmigo(eleitorUid, alvoUid, tipoTermometro);

            botao.disabled = false;
            botao.innerText = textoOriginal;

            if (resultado.sucesso) {
                alert("🎉 Voto computado! Você ajudou a encher a barra de reputação do seu amigo.");
                
                // Atualiza o valor textual na tela na mesma hora
                const sufixo = tipoTermometro.split('_')[1];
                const spanValor = document.getElementById(`txt-val-${sufixo}`);
                const barraPreenchida = document.querySelector(`.id-barra-${sufixo}`);
                
                if (spanValor) {
                    let valorAtual = parseInt(spanValor.innerText) || 0;
                    const novoValor = Math.min(valorAtual + 5, 100);
                    spanValor.innerText = `${novoValor}%`;
                    if (barraPreenchida) {
                        barraPreenchida.style.width = `${novoValor}%`;
                    }
                }
            } else {
                alert(resultado.erro);
            }
        });
    });
}

// Inicializa a escuta assim que o DOM estiver pronto
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => inicializarCliquesDeVotacao());
    } else {
        inicializarCliquesDeVotacao();
    }
}
