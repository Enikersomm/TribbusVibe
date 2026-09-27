// 🪐 Tribbu'sVibe - Sistema de Votação Mútua de Termômetros
// Arquivo: src/services/firebase-reputacao.js

import { db } from "./tribbusFirebase.js";
import { doc, updateDoc, increment, collection, addDoc, query, where, getDocs } from "firebase/firestore";

/**
 * 🗳️ VOTAR NO AMIGO: Adiciona 1 ponto na barrinha escolhida do amigo (Confiável, Legal ou Vibe)
 * @param {string} eleitorUid - Quem está votando (usuário logado)
 * @param {string} alvoUid - O dono do perfil que está recebendo o voto
 * @param {string} tipoTermometro - 'medidor_confiavel', 'medidor_legal' ou 'medidor_vibe'
 */
export async function votarNoTermometroAmigo(eleitorUid, alvoUid, tipoTermometro) {
    try {
        if (!eleitorUid || !alvoUid) {
            return { sucesso: false, erro: "⚠️ Usuário não autenticado ou perfil inválido." };
        }

        if (eleitorUid === alvoUid) {
            return { sucesso: false, erro: "⚠️ Você não pode votar no seu próprio termômetro, malandro!" };
        }

        // 🛡️ SEGURANÇA ANTISPAM: Verifica se o usuário já votou nesse termômetro específico hoje
        const limiteQuery = query(
            collection(db, "reputacao_votos"),
            where("eleitor_uid", "==", eleitorUid),
            where("alvo_uid", "==", alvoUid),
            where("tipo_voto", "==", tipoTermometro)
        );
        const snapshot = await getDocs(limiteQuery);
        if (!snapshot.empty) {
            return { sucesso: false, erro: "🔒 Você já avaliou a vibe desse amigo hoje! Volte amanhã." };
        }

        // 1. Registra o voto na coleção pivot de auditoria
        await addDoc(collection(db, "reputacao_votos"), {
            eleitor_uid: eleitorUid,
            alvo_uid: alvoUid,
            tipo_voto: tipoTermometro,
            data_voto: new Date().toISOString()
        });

        // 2. Dá o 'Soma +5%' de largura seguro direto no documento do usuário alvo no Firestore
        const usuarioAlvoRef = doc(db, "usuarios", alvoUid);
        await updateDoc(usuarioAlvoRef, {
            [tipoTermometro]: increment(5) // Sobe a barrinha em 5% a cada voto recebido
        });

        console.log(`Voto computado com sucesso no ${tipoTermometro}!`);
        return { sucesso: true };

    } catch (error) {
        console.error("Erro ao processar voto de reputação:", error.message);
        return { sucesso: false, erro: error.message };
    }
}
