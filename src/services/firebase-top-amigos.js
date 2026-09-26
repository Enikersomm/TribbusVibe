// 🪐 Tribbu'sVibe - Lógica da Vitrine de Amigos Favoritos (Sem Limite)
// Arquivo: firebase-top-amigos.js

import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "./tribbusFirebase.js";

/**
 * 🌟 FAVORITAR AMIGO: Adiciona um amigo na vitrine do seu perfil (Sem limite de quantidade!)
 * @param {string} usuarioLogadoId - Quem está favoritando
 * @param {string} amigoId - Quem está sendo favoritado
 * @param {string} amigoNome - Nome do amigo
 * @param {string} amigoAvatar - URL ou gravatar da foto
 */
export async function adicionarAmigoNoTop(usuarioLogadoId, amigoId, amigoNome, amigoAvatar) {
    try {
        if (!usuarioLogadoId || !amigoId) {
            throw new Error("IDs de usuário e amigo são obrigatórios.");
        }

        // Verifica se já não foi favoritado para evitar duplicatas acidentais
        const qExiste = query(
            collection(db, "top_amigos"),
            where("usuario_id", "==", usuarioLogadoId),
            where("amigo_id", "==", amigoId)
        );
        const snapshotExiste = await getDocs(qExiste);
        if (!snapshotExiste.empty) {
            console.log("Este amigo já está na sua vitrine de favoritos!");
            return { sucesso: true, jaExistia: true, id: snapshotExiste.docs[0].id };
        }

        const docRef = await addDoc(collection(db, "top_amigos"), {
            usuario_id: usuarioLogadoId, // Quem está favoritando
            amigo_id: amigoId,           // Quem está sendo favoritado
            amigo_nome: amigoNome || "Amigo da Vibe",
            amigo_avatar: amigoAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            data_favoritado: new Date().toISOString()
        });
        console.log("Amigo adicionado à sua vitrine de favoritos!");
        return { sucesso: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao favoritar amigo no sistema:", error.message);
        return { sucesso: false, erro: error.message };
    }
}

/**
 * ❌ REMOVER AMIGO DO TOP: Remove um amigo da vitrine de favoritos
 * @param {string} idDocumento - ID do documento na coleção top_amigos
 */
export async function removerAmigoDoTop(idDocumento) {
    try {
        if (!idDocumento) return { sucesso: false };
        await deleteDoc(doc(db, "top_amigos", idDocumento));
        console.log("Amigo removido da vitrine com sucesso.");
        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao remover amigo da vitrine:", error.message);
        return { sucesso: false, erro: error.message };
    }
}

/**
 * 🔄 ESCUTAR VITRINE DE AMIGOS: Puxa todos os amigos favoritados para exibir no perfil lateral
 * @param {string} usuarioLogadoId - UID do usuário dono do perfil
 * @param {Function} callbackRenderizarGrade - Callback com a lista de favoritos
 * @returns {Function|null} Unsubscribe listener
 */
export function escutarVitrineAmigos(usuarioLogadoId, callbackRenderizarGrade) {
    if (!usuarioLogadoId) {
        console.warn("escutarVitrineAmigos: usuarioLogadoId não informado.");
        return null;
    }

    try {
        const consultaTop = query(
            collection(db, "top_amigos"),
            where("usuario_id", "==", usuarioLogadoId),
            orderBy("data_favoritado", "asc") // Lista na ordem em que foram favoritados
        );

        return onSnapshot(consultaTop, (snapshot) => {
            const listaFavoritos = [];
            snapshot.forEach((docSnap) => {
                listaFavoritos.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });
            // Manda a lista ilimitada direto para atualizar a grade do HTML Dark Mode
            if (typeof callbackRenderizarGrade === "function") {
                callbackRenderizarGrade(listaFavoritos);
            }
        }, (error) => {
            console.error("Erro na escuta da vitrine de amigos:", error);
        });
    } catch (error) {
        console.error("Erro na escuta da vitrine de amigos:", error.message);
        return null;
    }
}
