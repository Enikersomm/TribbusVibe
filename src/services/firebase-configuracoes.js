// 🪐 Tribbu'sVibe - Lógica de Atualização de Perfil e Termômetros
// Arquivo: firebase-configuracoes.js

import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./tribbusFirebase.js";

/**
 * 🛠️ SALVAR CONFIGURAÇÕES: Atualiza a identidade visual e os termômetros do usuário no banco
 * @param {string} usuarioId - O UID do usuário logado (gerado pelo Firebase Auth)
 * @param {Object} dadosAtualizados - Objeto contendo os campos modificados na interface
 */
export async function salvarConfiguracoesPerfil(usuarioId, dadosAtualizados) {
    try {
        if (!db) {
            return { sucesso: false, erro: "Banco Firestore não inicializado." };
        }
        // Criamos a referência direta e precisa para o documento do usuário
        const usuarioRef = doc(db, "usuarios", usuarioId);

        // Disparamos a atualização seletiva ou criação para o Firestore
        await setDoc(usuarioRef, {
            ...dadosAtualizados,
            ultima_atualizacao: new Date().toISOString() // Mapeia quando a mudança foi feita
        }, { merge: true });

        console.log("Sucesso! As novas vibes do perfil foram salvas no Tribbu'sVibe.");
        return { sucesso: true };

    } catch (error) {
        console.error("Erro técnico ao salvar as configurações no Firestore:", error?.message || error);
        return { sucesso: false, erro: error?.message || String(error) };
    }
}

/**
 * 📥 CARREGAR DADOS ATUAIS: Busca as informações do banco para já virem preenchidas na tela
 * @param {string} usuarioId - O UID do usuário logado
 */
export async function buscarDadosConfiguracao(usuarioId) {
    try {
        const usuarioRef = doc(db, "usuarios", usuarioId);
        const snapshot = await getDoc(usuarioRef);

        if (snapshot.exists()) {
            return { sucesso: true, dados: snapshot.data() };
        } else {
            console.warn("Usuário não encontrado na nossa órbita.");
            return { sucesso: false, erro: "Perfil não encontrado." };
        }
    } catch (error) {
        console.error("Erro ao buscar dados de configuração:", error?.message || error);
        return { sucesso: false, erro: error?.message || String(error) };
    }
}
