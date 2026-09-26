// 🪐 Tribbu'sVibe - Módulo Utilitário de Limpeza e Reset do Banco (Pré-Lançamento)
// Arquivo: src/services/zerar-banco.js

import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './tribbusFirebase.js';

/**
 * Lista de todas as coleções de dados no Firestore do Tribbu'sVibe
 */
const COLECOES_TRIBBUS = [
  'feed_posts',
  'feed_comentarios',
  'comunidades_stories',
  'comunidades',
  'forum_topicos',
  'forum_respostas',
  'scraps',
  'chats_privados',
  'top_amigos',
  'notificacoes_usuario',
  'eventos',
  'usuarios'
];

/**
 * Zera todas as coleções de teste do Firebase Firestore
 * @returns {Promise<{sucesso: boolean, totalApagados?: number, relatorio?: Record<string, number>, erro?: string}>}
 */
export async function zerarBancoTribbusVibe() {
  if (!db) {
    return { sucesso: false, erro: 'Instância do Firestore não encontrada.' };
  }

  console.log("🧹 [Tribbu'sVibe] Iniciando Faxina Pré-Lançamento no Firestore...");
  const relatorio = {};
  let totalApagados = 0;

  try {
    for (const nomeColecao of COLECOES_TRIBBUS) {
      console.log(`🗑️ Limpando coleção: ${nomeColecao}...`);
      const colRef = collection(db, nomeColecao);
      const snapshot = await getDocs(colRef);
      
      let apagadosNestaColecao = 0;

      // Se for stories, verifica também subcoleções de comentários
      if (nomeColecao === 'comunidades_stories') {
        for (const storyDoc of snapshot.docs) {
          try {
            const subCol = collection(db, 'comunidades_stories', storyDoc.id, 'comentarios');
            const subSnap = await getDocs(subCol);
            for (const subDoc of subSnap.docs) {
              await deleteDoc(subDoc.ref);
              totalApagados++;
            }
          } catch (e) {
            console.warn(`Subcoleção comentários ignorada para ${storyDoc.id}:`, e);
          }
        }
      }

      // Deleta em lotes para performance e confiabilidade
      const docs = snapshot.docs;
      const CHUNK_SIZE = 400; // Limite seguro do batch do Firestore é 500
      
      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + CHUNK_SIZE);
        
        chunk.forEach((d) => {
          batch.delete(d.ref);
        });

        await batch.commit();
        apagadosNestaColecao += chunk.length;
        totalApagados += chunk.length;
      }

      relatorio[nomeColecao] = apagadosNestaColecao;
      console.log(`✅ Coleção ${nomeColecao} zerada (${apagadosNestaColecao} documentos apagados).`);
    }

    // Limpa também o cache local de testes do navegador
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Mantém apenas configurações essenciais se houver, mas remove sessões de teste
        const logo = localStorage.getItem('tribbus_custom_logo_v3');
        localStorage.clear();
        if (logo) {
          localStorage.setItem('tribbus_custom_logo_v3', logo);
        }
      }
    } catch (e) {
      console.warn("Aviso ao limpar localStorage:", e);
    }

    console.log("🚀 [Tribbu'sVibe] Faxina completa!", { totalApagados, relatorio });
    return { 
      sucesso: true, 
      totalApagados, 
      relatorio 
    };

  } catch (error) {
    console.error("❌ Erro durante a faxina do banco:", error);
    return { 
      sucesso: false, 
      erro: error.message || String(error) 
    };
  }
}

export default zerarBancoTribbusVibe;
