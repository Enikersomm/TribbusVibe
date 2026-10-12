// 🪐 Tribbu'sVibe - Sistema de Respostas do Fórum (Realtime)
// Arquivo: firebase-respostas.js

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment 
} from "firebase/firestore";
import { db } from "./tribbusFirebase.js";

/**
 * ✍️ ENVIAR RESPOSTA: Comenta dentro de uma discussão ativa
 * @param {string} topicoId - ID do tópico que está recebendo o comentário
 * @param {string} autorId - UID de quem está comentando
 * @param {string} autorNome - Nome de quem comentou
 * @param {string} textoResposta - O conteúdo do comentário
 */
export async function enviarRespostaTopico(topicoId, autorId, autorNome, textoResposta) {
    try {
        if (!topicoId || !textoResposta || !textoResposta.trim()) {
            return { sucesso: false, erro: "O comentário e o ID do tópico são obrigatórios." };
        }

        // 1. Grava o comentário no banco
        const respostaDoc = await addDoc(collection(db, "forum_respostas"), {
            topico_id: topicoId,
            autor_id: autorId || "anonimo",
            autor_name: autorNome || "@membro_da_tribo",
            conteudo_texto: textoResposta.trim(),
            data_envio: new Date().toISOString()
        });

        // 2. Dá um 'Soma +1' automático no contador de respostas do tópico principal
        try {
            const topicoRef = doc(db, "forum_topicos", topicoId);
            await updateDoc(topicoRef, {
                respostas_contador: increment(1)
            });
        } catch (updateErr) {
            console.warn("Aviso ao atualizar contador de respostas do tópico:", updateErr.message);
        }

        console.log("Resposta computada com sucesso! ID:", respostaDoc.id);
        return { sucesso: true, id: respostaDoc.id };
    } catch (error) {
        console.error("Erro ao responder tópico:", error.message);
        return { sucesso: false, erro: error.message };
    }
}

/**
 * 🔄 ESCUTAR RESPOSTAS: Monitora e lista os comentários do tópico em tempo real
 */
export function escutarRespostasDoTopico(topicoId, callbackRenderizar) {
    try {
        if (!topicoId) {
            callbackRenderizar([]);
            return () => {};
        }

        const consulta = query(
            collection(db, "forum_respostas"),
            where("topico_id", "==", topicoId)
        );

        return onSnapshot(consulta, (snapshot) => {
            const listaRespostas = [];
            snapshot.forEach((docSnap) => {
                listaRespostas.push({ id: docSnap.id, ...docSnap.data() });
            });

            // Antigas primeiro para ler como uma conversa de cima para baixo
            listaRespostas.sort((a, b) => new Date(a.data_envio || 0).getTime() - new Date(b.data_envio || 0).getTime());

            callbackRenderizar(listaRespostas);
        }, (error) => {
            console.error("Erro na escuta de respostas:", error.message);
            callbackRenderizar([]);
        });
    } catch (error) {
        console.error("Erro na escuta de respostas:", error.message);
        callbackRenderizar([]);
        return () => {};
    }
}
