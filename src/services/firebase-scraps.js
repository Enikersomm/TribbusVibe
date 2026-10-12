// 🪐 Tribbu'sVibe - Lógica dos Scraps do Mural (Tempo Real)
// Arquivo: firebase-scraps.js

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from "firebase/firestore";
import { db } from "./tribbusFirebase.js";

// 🪐 Tribbu'sVibe - Abertura Pública do Mural de Recados do Perfil
// Encanamento para atualizar e deixar salvo na sua pasta física local

export function escutarMuralDoPerfilReal(uidDoPerfilVisitado, containerMuralLista) {
    if (!uidDoPerfilVisitado || !containerMuralLista) return;

    console.log(`📡 Conectando cano ao vivo com o mural do usuário dono do perfil: ${uidDoPerfilVisitado}`);

    // 🔥 A CORREÇÃO: O filtro busca os recados que pertencem a este perfil específico (público)
    const qMural = query(
        collection(db, "mural_recados"),
        where("perfil_dono_uid", "==", uidDoPerfilVisitado), // Filtra pelo dono da tela, e não por você!
        orderBy("data_criacao", "desc")
    );

    return onSnapshot(qMural, (snapshot) => {
        containerMuralLista.innerHTML = "";

        if (snapshot.empty) {
            containerMuralLista.innerHTML = `<div style="font-size: 0.8rem; color: var(--texto-suave); font-style: italic; padding: 10px 0;">Nenhuma vibe deixada no mural ainda... Deixe um recado! ✨</div>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const recado = docSnap.data();
            const itemRecado = document.createElement("div");
            
            // Layout cyberpunk elegante para a mensagem aparecer para todos
            itemRecado.style.background = "var(--cinza-input, #18181b)";
            itemRecado.style.padding = "12px 16px";
            itemRecado.style.borderRadius = "12px";
            itemRecado.style.marginBottom = "10px";
            itemRecado.style.borderLeft = "3px solid var(--pink-magenta)";
            
            itemRecado.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <strong style="color: var(--ciano-neon); font-size: 0.8rem;">🤠 ${recado.autor_nome || 'Membro da Tribu'}</strong>
                    <span style="font-size: 0.7rem; color: var(--texto-suave);">${recado.tempo_atras || 'agora há pouco'}</span>
                </div>
                <p style="margin: 0; font-size: 0.88rem; color: #FFF; line-height: 1.4;">${recado.texto || recado.conteudo_texto || ""}</p>
            `;
            containerMuralLista.appendChild(itemRecado);
        });
    }, (error) => {
        console.warn("Aviso ao escutar mural_recados em tempo real:", error?.message || error);
    });
}

/**
 * ✍️ ENVIAR SCRAP: Grava um novo recado no mural do usuário no Firestore
 * @param {string} remetenteId
 * @param {string} remetenteNome
 * @param {string} destinatarioId
 * @param {string} conteudoTexto
 */
export async function enviarScrapMural(remetenteId, remetenteNome, destinatarioId, conteudoTexto) {
  try {
    if (!conteudoTexto || !conteudoTexto.trim()) {
      return { sucesso: false, erro: "O texto do scrap não pode ser vazio." };
    }

    const agoraIso = new Date().toISOString();

    // 1. Grava na coleção mural_recados (novo encanamento)
    const docMuralRef = await addDoc(collection(db, "mural_recados"), {
      perfil_dono_uid: destinatarioId,
      autor_uid: remetenteId || "anonimo",
      autor_nome: remetenteNome || "@membro_da_tribu",
      texto: conteudoTexto.trim(),
      conteudo_texto: conteudoTexto.trim(),
      tempo_atras: "agora mesmo",
      data_criacao: agoraIso
    });

    // 2. Grava também na coleção scraps (retrocompatibilidade)
    await addDoc(collection(db, "scraps"), {
      remetente_id: remetenteId || "anonimo",
      remetente_nome: remetenteNome || "@membro_da_tribo",
      destinatario_id: destinatarioId,
      conteudo_texto: conteudoTexto.trim(),
      data_criacao: agoraIso
    }).catch(() => {});

    console.log("Scrap lançado no mural com sucesso! ID:", docMuralRef.id);
    return { sucesso: true, id: docMuralRef.id };
  } catch (error) {
    console.error("Erro ao enviar scrap no mural:", error?.message || error);
    return { sucesso: false, erro: error?.message || "Erro desconhecido" };
  }
}

/**
 * 📥 ESCUTAR SCRAPS: Ouve em tempo real os recados recebidos por um usuário
 * @param {string} destinatarioId
 * @param {function} callback
 */
export function escutarScrapsDoPerfil(destinatarioId, callback) {
  try {
    if (!destinatarioId) {
      callback([]);
      return () => {};
    }

    const scrapsRef = collection(db, "scraps");
    const q = query(
      scrapsRef,
      where("destinatario_id", "==", destinatarioId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scraps = [];
      snapshot.forEach((docSnap) => {
        scraps.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Ordena por data de criação descrescente (mais recente primeiro)
      scraps.sort((a, b) => {
        const timeA = new Date(a.data_criacao || 0).getTime();
        const timeB = new Date(b.data_criacao || 0).getTime();
        return timeB - timeA;
      });

      callback(scraps);
    }, (error) => {
      console.warn("Aviso ao escutar scraps em tempo real:", error?.message || error);
      callback([]);
    });

    return unsubscribe;
  } catch (err) {
    console.error("Erro ao configurar escuta de scraps:", err);
    callback([]);
    return () => {};
  }
}
