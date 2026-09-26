// 🪐 Tribbu'sVibe - Lógica dos Scraps do Mural (Tempo Real)
// Arquivo: firebase-scraps.js

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "./tribbusFirebase.js";

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

    const docRef = await addDoc(collection(db, "scraps"), {
      remetente_id: remetenteId || "anonimo",
      remetente_nome: remetenteNome || "@membro_da_tribo",
      destinatario_id: destinatarioId,
      conteudo_texto: conteudoTexto.trim(),
      data_criacao: new Date().toISOString()
    });

    console.log("Scrap lançado no mural com sucesso! ID:", docRef.id);
    return { sucesso: true, id: docRef.id };
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
