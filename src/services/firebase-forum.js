// 🪐 Tribbu'sVibe - Sistema de Fórum e Discussões em Tempo Real
// Arquivo: firebase-forum.js

import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "./tribbusFirebase.js";

const TRIBO_PADRAO_ID = "tribo_oficial";

/**
 * ✍️ LANÇAR TÓPICO: Cria uma nova discussão/tópico dentro de uma Tribo específica
 * @param {string} triboId - ID da comunidade atual
 * @param {string} autorId - UID de quem está abrindo o tópico
 * @param {string} autorNome - Nome/Handle de quem criou
 * @param {string} titulo - O título da discussão
 * @param {string} argumentoInicial - O texto de abertura do debate
 */
export async function lancarNovoTopico(triboId, autorId, autorNome, titulo, argumentoInicial) {
    try {
        const docRef = await addDoc(collection(db, "forum_topicos"), {
            comunidade_id: triboId || TRIBO_PADRAO_ID,
            autor_id: autorId || "anonimo",
            autor_name: autorNome || "@membro_da_tribo",
            titulo_topico: (titulo || "").trim(),
            conteudo_inicial: (argumentoInicial || "").trim(),
            respostas_contador: 0, // Começa zerado
            data_criacao: new Date().toISOString()
        });

        console.log("Sucesso! Tópico aberto no fórum do Tribbu'sVibe:", docRef.id);
        return { sucesso: true, topicoId: docRef.id, id: docRef.id };
    } catch (error) {
        console.error("Erro ao lançar tópico no fórum:", error.message);
        return { sucesso: false, erro: error.message };
    }
}

/**
 * 🔄 ESCUTAR TÓPICOS DO FÓRUM: Lista as discussões de uma Tribo em tempo real
 * @param {string} triboId - ID da comunidade atual
 * @param {Function} callbackRenderizar - Função que atualiza o HTML da tela
 */
export function escutarTopicosDaTribo(triboId = TRIBO_PADRAO_ID, callbackRenderizar) {
    try {
        // Busca os tópicos filtrando pela comunidade
        const consultaTopicos = query(
            collection(db, "forum_topicos"),
            where("comunidade_id", "==", triboId)
        );

        // Deixa o canal em tempo real aberto com o Firebase
        return onSnapshot(consultaTopicos, (snapshot) => {
            const listaTopicos = [];
            snapshot.forEach((docSnap) => {
                listaTopicos.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });

            // Ordenação cronológica antialgoritmo (mais recentes primeiro)
            listaTopicos.sort((a, b) => new Date(b.data_criacao || 0).getTime() - new Date(a.data_criacao || 0).getTime());

            // Repassa a lista limpa para o HTML renderizar as linhas do fórum
            callbackRenderizar(listaTopicos);
        }, (error) => {
            console.error("Erro na escuta em tempo real dos tópicos:", error.message);
            callbackRenderizar([]);
        });
    } catch (error) {
        console.error("Erro na escuta em tempo real dos tópicos:", error.message);
        callbackRenderizar([]);
        return () => {};
    }
}

// Aliases e re-exportações para compatibilidade total
export { enviarRespostaTopico, escutarRespostasDoTopico } from "./firebase-respostas.js";

export const criarTopicoForum = (triboId, autorId, autorNome, titulo, corpo) => 
    lancarNovoTopico(triboId, autorId, autorNome, titulo, corpo);

export const escutarTopicosDoForum = (triboId, callback) => 
    escutarTopicosDaTribo(triboId, callback);

/**
 * 🎮 Garante que a tribo padrão exista no banco
 */
export async function obterDadosTribo(triboId = TRIBO_PADRAO_ID) {
  try {
    // 1. Tenta buscar na coleção comunidades
    const docRef = doc(db, "comunidades", triboId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      return { 
        id: snap.id, 
        ...data,
        criador_uid: data.criador_uid || data.criador_id || (triboId === TRIBO_PADRAO_ID ? "oficial" : null)
      };
    }

    // 2. Se não achou em comunidades, busca na coleção tribos (onde novas tribos são fundadas)
    if (triboId !== TRIBO_PADRAO_ID) {
      const triboRef = doc(db, "tribos", triboId);
      const triboSnap = await getDoc(triboRef);
      if (triboSnap.exists()) {
        const tData = triboSnap.data();
        return {
          id: triboSnap.id,
          nome: tData.nome || "Tribbu",
          descricao: tData.descricao || "Comunidade do Tribbu'sVibe.",
          capa_url: tData.capa_url || "",
          emblema: tData.emblema || tData.icone_emoji || "🪐",
          membros_count: tData.membros_contador || tData.membros_count || 1,
          criador_uid: tData.criador_uid || tData.criador_id || null,
          criador_id: tData.criador_id || tData.criador_uid || null
        };
      }
    }

    const dadosIniciais = {
      nome: "Tribbu's Oficial",
      descricao: "Comunidade principal para reunir todos os membros do Tribbu'sVibe.",
      emblema: "🪐",
      membros_count: 1,
      membros: [],
      categoria: "Geral",
      criador_uid: "oficial",
      criador_id: "oficial",
      data_criacao: new Date().toISOString()
    };

    if (triboId === TRIBO_PADRAO_ID) {
      await setDoc(docRef, dadosIniciais);
    }
    return { id: triboId, ...dadosIniciais };
  } catch (err) {
    console.warn("Aviso ao obter dados da tribo:", err);
    return {
      id: triboId,
      nome: "Tribbu's Oficial",
      descricao: "Comunidade principal para reunir todos os membros do Tribbu'sVibe.",
      emblema: "🪐",
      membros_count: 1
    };
  }
}

/**
 * 🤝 PARTICIPAR DA TRIBO
 */
export async function alternarParticipacaoTribo(triboId = TRIBO_PADRAO_ID, usuarioId) {
  try {
    const docRef = doc(db, "comunidades", triboId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return { sucesso: false };

    const dados = snap.data();
    const membros = Array.isArray(dados.membros) ? dados.membros : [];
    const jaParticipa = membros.includes(usuarioId);

    let novosMembros;
    let novoCount = dados.membros_count || 2140;

    if (jaParticipa) {
      novosMembros = membros.filter(id => id !== usuarioId);
      novoCount = Math.max(0, novoCount - 1);
    } else {
      novosMembros = [...membros, usuarioId];
      novoCount += 1;
    }

    await setDoc(docRef, {
      ...dados,
      membros: novosMembros,
      membros_count: novoCount
    });

    return { sucesso: true, participando: !jaParticipa, total: novoCount };
  } catch (err) {
    console.warn("Aviso ao alternar participação:", err);
    return { sucesso: false, erro: err?.message };
  }
}
