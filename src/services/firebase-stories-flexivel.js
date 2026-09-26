// 🪐 Tribbu'sVibe - Sistema Híbrido e Flexível de Vibes (Stories das Tribos)
// Arquivo: firebase-stories-flexivel.js

import { collection, addDoc, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "./tribbusFirebase.js";
import { fazerUploadDeFoto, redimensionarEComprimirImagem } from "./firebase-storage.js"; // Nosso cofrinho de mídias

/**
 * 🚀 LANÇAR VIBE FLEXÍVEL: Envia uma foto, um texto neon ou uma música de 24h para a Tribo
 * @param {string} usuarioId - UID do autor
 * @param {string} comunidadeId - ID da Tribo atual
 * @param {Object} conteudoVibe - Objeto contendo { tipo: 'foto'|'texto'|'musica', dado: 'url_da_foto'|'texto_digitado', corFundo: '#hex', musicaId: 'id' }
 */
export async function lancarVibeFlexivel(usuarioId, comunidadeId, conteudoVibe) {
    try {
        let dadoSeguro = conteudoVibe.dado;
        if (conteudoVibe.tipo === 'foto' && typeof dadoSeguro === 'string' && dadoSeguro.startsWith('data:image')) {
            dadoSeguro = await redimensionarEComprimirImagem(dadoSeguro, 1080, 0.72);
        }

        await addDoc(collection(db, "comunidades_stories"), {
            autor_id: usuarioId,
            comunidade_id: comunidadeId,
            tipo_conteudo: conteudoVibe.tipo, // 'foto', 'texto' ou 'musica'
            dado_conteudo: dadoSeguro,        // Link da foto, ou o texto digitado
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

/**
 * 🔄 ESCUTAR MURAL DE VIBES: Monitora o topo do feed e desenha a bolinha certa baseada no tipo de conteúdo
 */
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
        // Passa as vibes híbridas para o HTML renderizar com inteligência
        callbackRenderizarBolinhas(listaVibes);
    });
}

export { fazerUploadDeFoto };
