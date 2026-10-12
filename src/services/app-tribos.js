// 🪐 Tribbu'sVibe - Renderizador Estável de Tribos (Sem Loops ou IDs Duplicados)
// Arquivo local para atualizar: src/services/app-tribos.js

import { collection, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "./tribbusFirebase.js";

export function escutarEListarTribosGerais(containerAlvo) {
    if (!containerAlvo) return;

    console.log("📡 Conectando cano público de comunidades em tempo real...");

    // 🔒 BARREIRA ANTI-LOOP: Uma única escuta limpa do Firebase
    return onSnapshot(collection(db, "tribos"), (snapshot) => {
        // Limpa a tela uma única vez antes de despejar a lista atualizada
        containerAlvo.innerHTML = "";

        if (snapshot.empty) {
            containerAlvo.innerHTML = `<p style="font-size:0.85rem; color:var(--texto-suave); font-style:italic;">Nenhuma Tribu fundada no universo ainda...</p>`;
            return;
        }

        const meuUID = auth?.currentUser?.uid || localStorage.getItem("tribbus_user_session");

        snapshot.forEach((docSnap) => {
            const tribuId = docSnap.id;
            const dadosTribu = docSnap.data();

            // 🛡️ REGRAS DE PRIVACIDADE ISOLADAS POR CARD:
            const souOCriador = (dadosTribu.criador_uid || dadosTribu.criador_id) === meuUID;
            const listaMembros = dadosTribu.membros_ids || dadosTribu.membros || [];
            const jaSouMembro = Array.isArray(listaMembros) && listaMembros.includes(meuUID);

            // Cria o bloco HTML exclusivo da comunidade
            const cardItem = document.createElement("div");
            cardItem.className = "card-individual-tribu";
            cardItem.style.cssText = "background: var(--cinza-card, #121214); padding: 16px; border-radius: 16px; display: flex; align-items: center; gap: 14px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.02); min-width: 280px;";

            // 📐 Define o botão de ação correto com base em quem está olhando a tela
            let htmlBotaoAcao = "";
            if (souOCriador) {
                // Se eu sou o fundador, o botão rosa nem nasce! Ganhamos a tag de dono
                htmlBotaoAcao = `<span style="font-size: 0.72rem; color: var(--ciano-neon, #00F0FF); font-weight: bold; font-style: italic; padding: 8px 12px; background: rgba(0, 240, 255, 0.05); border-radius: 50px; border: 1px solid rgba(0, 240, 255, 0.2);">👑 Fundador</span>`;
            } else if (jaSouMembro) {
                // Se eu sou um visitante que já entrou na comunidade antes
                htmlBotaoAcao = `<span style="font-size: 0.72rem; color: var(--pink-magenta, #FF007F); font-weight: bold; padding: 8px 12px; background: rgba(255, 0, 127, 0.05); border-radius: 50px; border: 1px solid rgba(255, 0, 127, 0.2);"><i class="fas fa-check"></i> Membro</span>`;
            } else {
                // Se for a Malu ou outro visitante novo, o botão nasce FIXO e Firme!
                htmlBotaoAcao = `<button class="btn-participar-tribbu-action" data-tribu-id="${tribuId}" style="background: var(--pink-magenta, #FF007F); color: #FFF; border: none; padding: 8px 16px; border-radius: 50px; font-size: 0.75rem; font-weight: bold; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 10px rgba(255, 0, 127, 0.25);">Participar da Tribbu</button>`;
            }

            // Injeta a estrutura completa do bando
            cardItem.innerHTML = `
                <img src="${dadosTribu.capa_url || 'img/saturno-logo.png'}" style="width: 48px; height: 48px; border-radius: 12px; object-fit: cover; border: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="window.location.href='tribos.html?id=${tribuId}'">
                <div style="display: flex; flex-direction: column; gap: 2px; flex: 1; cursor: pointer;" onclick="window.location.href='tribos.html?id=${tribuId}'">
                    <strong style="color: #FFFFFF; font-size: 0.88rem; letter-spacing: 0.3px;">${dadosTribu.nome}</strong>
                    <span style="color: var(--texto-suave, #9AA0A6); font-size: 0.75rem; line-height: 1.3; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${dadosTribu.descricao || 'Sem manifesto cadastrado.'}</span>
                </div>
                <div class="area-botao-tribu-link" style="margin-left: auto; flex-shrink: 0;">
                    ${htmlBotaoAcao}
                </div>
            `;

            // Vincula o evento de clique direto no botão de participar se ele existir no card
            const botaoCriado = cardItem.querySelector(".btn-participar-tribbu-action");
            if (botaoCriado) {
                botaoCriado.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!meuUID) {
                        alert("⚠️ Conecte-se para participar desta Tribbu!");
                        return;
                    }

                    botaoCriado.disabled = true;
                    botaoCriado.innerText = "⏳ Entrando...";

                    try {
                        const docRef = doc(db, "tribos", tribuId);
                        await updateDoc(docRef, {
                            membros_ids: arrayUnion(meuUID),
                            membros: arrayUnion(meuUID)
                        });
                        alert("🎉 Sucesso! Você agora faz parte desta Tribu no universo! 🪐");
                    } catch (err) {
                        console.error("Erro ao colar na Tribu:", err);
                        botaoCriado.disabled = false;
                        botaoCriado.innerText = "Participar da Tribbu";
                    }
                };
            }

            containerAlvo.appendChild(cardItem);
        });
    });
}
