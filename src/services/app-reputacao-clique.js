// 🪐 Tribbu'sVibe - Central Suprema de Votação e Reputação Legítima
// Arquivo: src/services/app-reputacao-clique.js

import { doc, updateDoc, increment } from "firebase/firestore";
import { db, auth } from "./tribbusFirebase.js";

export function inicializarCliquesDeVotacao() {
    // Captura os 3 botões neon de voto na tela (+1 🧊, +1 ❤️, +1 🌟)
    const botoesVoto = document.querySelectorAll(".btn-voto-neon");

    botoesVoto.forEach((botao) => {
        // 🔒 LIMPEZA SUPREMA: Remove qualquer escuta antiga que tenha ficado duplicada
        botao.onclick = null;

        // Liga a nova e única escuta de clique blindada
        botao.onclick = async (e) => {
            e.preventDefault();

            const meuUID = auth?.currentUser?.uid;
            if (!meuUID) {
                alert("⚠️ Órbita inválida! Faça login para conseguir votar em um amigo.");
                return;
            }

            // 🔍 Captura quem é o dono do perfil que está na barra de endereço URL (?id=UID ou ?uid=UID)
            const parametrosUrl = new URLSearchParams(window.location.search);
            const alvoUid = parametrosUrl.get("id") || parametrosUrl.get("uid");

            // Se não houver ID na URL, significa que o usuário está no próprio perfil dele!
            const uidDonoDoPerfil = alvoUid || meuUID;

            // 🛡️ TRAVA ANTIAUTO-VOTO CONTRA TRAPAÇAS
            if (meuUID === uidDonoDoPerfil) {
                alert("⚠️ Você não pode votar no seu próprio termômetro, malandro! Deixe que a Tribu avalie sua vibe. 😉🪐");
                return; // Bloqueia o avanço pro Firebase na hora!
            }

            // Se passou da trava, o usuário é um visitante legítimo (Ex: Malu votando no Enikersom)
            const tipoTermometro = botao.getAttribute("data-termometro"); // medidor_confiavel, medidor_legal ou medidor_vibe
            if (!tipoTermometro) return;

            // Desativa o botão temporariamente para evitar cliques repetidos seguidos (gasto de cota)
            botao.disabled = true;
            const textoOriginal = botao.innerText;
            botao.innerText = "⏳...";

            try {
                console.log(`Computando +1 voto legítimo no termômetro [${tipoTermometro}] do usuário: ${uidDonoDoPerfil}`);
                
                // Atualiza o documento do amigo direto no Firestore subindo o contador
                const amigoRef = doc(db, "usuarios", uidDonoDoPerfil);
                await updateDoc(amigoRef, {
                    [tipoTermometro]: increment(1)
                });

                alert("🎉 Voto computado com sucesso! A reputação do seu amigo subiu no universo. 🌟");
                botao.style.borderColor = "var(--ciano-neon, #00F0FF)";

            } catch (err) {
                console.error("Erro crítico ao registrar voto no Firebase:", err);
                alert("⚠️ Erro ao computar voto. Verifique a conexão.");
            } finally {
                // Devolve o botão ao estado normal
                botao.disabled = false;
                botao.innerText = textoOriginal;
            }
        };
    });
}

// Inicializa automaticamente quando o DOM estiver pronto
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => inicializarCliquesDeVotacao());
    } else {
        setTimeout(() => inicializarCliquesDeVotacao(), 100);
    }
}
