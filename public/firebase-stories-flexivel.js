// 🪐 Tribbu'sVibe - Sistema Híbrido e Flexível de Vibes (Stories das Tribos)
// Arquivo: firebase-stories-flexivel.js

import { collection, addDoc, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "./tribbusFirebase.js";
import { fazerUploadDeFoto } from "./firebase-storage.js";

export async function lancarVibeFlexivel(usuarioId, comunidadeId, conteudoVibe) {
    try {
        await addDoc(collection(db, "comunidades_stories"), {
            autor_id: usuarioId,
            comunidade_id: comunidadeId,
            tipo_conteudo: conteudoVibe.tipo, // 'foto', 'texto' ou 'musica'
            dado_conteudo: conteudoVibe.dado,   // Link da foto, ou o texto digitado
            cor_fundo_neon: conteudoVibe.corFundo || "#121214", // Para vibes de apenas texto
            trilha_musica: conteudoVibe.musicaId || null,      // Música vinculada se houver
            data_criacao: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Some em 24h exatas!
        });

        console.log(`🎉 Nova Vibe do tipo [${conteudoVibe.tipo}] lançada na Tribo com sucesso!`);
        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao lançar vibe flexível:", error.message);
        return { sucesso: false, erro: error.message };
    }
}

export function escutarMuralVibesFlexivel(comunidadeId, callbackRenderizarBolinhas) {
    const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const consulta = query(
        collection(db, "comunidades_stories"),
        where("comunidade_id", "==", comunidadeId),
        where("data_criacao", ">=", vinteQuatroHorasAtras),
        orderBy("data_criacao", "desc")
    );

    return onSnapshot(consulta, (snapshot) => {
        const listaVibes = [];
        snapshot.forEach((doc) => {
            listaVibes.push({ id: doc.id, ...doc.data() });
        });
        callbackRenderizarBolinhas(listaVibes);
    });
}

export { fazerUploadDeFoto };
