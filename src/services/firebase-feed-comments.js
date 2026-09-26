// 🪐 Tribbu'sVibe - Sistema de Comentários do Feed Principal (Realtime)
// Arquivo: firebase-feed-comments.js

import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "./tribbusFirebase.js";

/**
 * ✍️ COMENTAR POST: Envia um comentário para um Micro-Vibe do feed geral
 * @param {string} postId - ID do post principal que está recebendo a resposta
 * @param {string} autorId - UID de quem está digitando o comentário
 * @param {string} autorNome - Nome/Handle de quem comentou
 * @param {string} textoComentario - O conteúdo digitado
 */
export async function enviarComentarioPost(postId, autorId, autorNome, textoComentario) {
    try {
        if (!postId || !textoComentario?.trim()) {
            return { sucesso: false, erro: "PostId e texto do comentário são obrigatórios." };
        }

        // 1. Grava o comentário na gaveta do banco de dados
        const docRef = await addDoc(collection(db, "feed_comentarios"), {
            post_id: postId,
            autor_id: autorId || "anonimo",
            autor_name: autorNome || "Membro da Tribo",
            conteudo_texto: textoComentario.trim(),
            data_envio: new Date().toISOString() // Ordem cronológica justa
        });

        // 2. Dá um 'Soma +1' automático no contador de comentários do post para atualizar o número no feed
        try {
            const postRef = doc(db, "feed_posts", postId);
            await updateDoc(postRef, {
                comentarios_contador: increment(1)
            });
        } catch (counterError) {
            console.warn("Aviso ao atualizar contador de comentários no post:", counterError.message);
        }

        console.log("Comentário computado no feed com sucesso!");
        return { sucesso: true, id: docRef.id };
    } catch (error) {
        console.error("Erro técnico ao comentar no post do feed:", error.message);
        return { sucesso: false, erro: error.message };
    }
}

/**
 * 🔄 ESCUTAR COMENTÁRIOS DO POST: Monitora e lista as respostas daquela postagem na hora
 * @param {string} postId - ID do post do feed
 * @param {Function} callbackRenderizar - Callback com a lista de comentários
 * @returns {Function} Unsubscribe listener
 */
export function escutarComentariosDoPost(postId, callbackRenderizar) {
    if (!postId) {
        console.warn("escutarComentariosDoPost: postId não informado.");
        return () => {};
    }

    try {
        const consultaComments = query(
            collection(db, "feed_comentarios"),
            where("post_id", "==", postId),
            orderBy("data_envio", "asc") // Mais antigos primeiro, para ler de cima para baixo
        );

        return onSnapshot(consultaComments, (snapshot) => {
            const listaComments = [];
            snapshot.forEach((docSnap) => {
                listaComments.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });
            // Repassa a lista atualizada para o HTML desenhar a gaveta de respostas
            if (typeof callbackRenderizar === "function") {
                callbackRenderizar(listaComments);
            }
        }, (error) => {
            console.error("Erro na escuta de comentários do post:", error);
        });
    } catch (error) {
        console.error("Erro na escuta de comentários do post:", error.message);
        return () => {};
    }
}

export default {
    enviarComentarioPost,
    escutarComentariosDoPost
};
