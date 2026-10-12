// 🪐 Tribbu'sVibe - Lógica de Adesão a Tribos (Tempo Real)
// Arquivo: firebase-tribos.js

import { 
  collection,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  arrayUnion, 
  arrayRemove,
  increment,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "./tribbusFirebase.js";

/**
 * 🤝 ENTRAR NA TRIBO: Registra o membro na comunidade selecionada
 * @param {string} usuarioId - UID do membro
 * @param {string} triboId - ID da comunidade/tribo
 */
export async function entrarNaTribo(usuarioId, triboId) {
    try {
        if (!usuarioId || !triboId) {
            return { sucesso: false, erro: "Identificadores de usuário ou comunidade inválidos." };
        }

        const docRef = doc(db, "comunidades", triboId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            await updateDoc(docRef, {
                membros: arrayUnion(usuarioId),
                membros_count: increment(1)
            });
        } else {
            await setDoc(docRef, {
                nome: "Tribo Oficial",
                descricao: "Comunidade da TribbusVibe",
                emblema: "🪐",
                membros_count: 1,
                membros: [usuarioId],
                data_criacao: new Date().toISOString()
            });
        }

        // Registra o relacionamento na coleção comunidades_membros
        const membroRef = doc(db, "comunidades_membros", `${triboId}_${usuarioId}`);
        await setDoc(membroRef, {
            comunidade_id: triboId,
            usuario_id: usuarioId,
            data_adesao: new Date().toISOString()
        }, { merge: true });

        console.log(`Sucesso: Usuário ${usuarioId} agora é membro da tribo ${triboId}!`);
        return { sucesso: true, ehMembro: true };
    } catch (error) {
        console.error("Erro ao entrar na tribo:", error.message);
        return { sucesso: false, erro: error.message };
    }
}

/**
 * 🚪 SAIR DA TRIBO: Remove o membro da comunidade selecionada
 */
export async function sairDaTribo(usuarioId, triboId) {
    try {
        if (!usuarioId || !triboId) {
            return { sucesso: false, erro: "Identificadores inválidos." };
        }

        const docRef = doc(db, "comunidades", triboId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const dados = snap.data();
            const contagemAtual = dados.membros_count || 1;
            await updateDoc(docRef, {
                membros: arrayRemove(usuarioId),
                membros_count: Math.max(0, contagemAtual - 1)
            });
        }

        // Remove o registro de comunidades_membros
        const membroRef = doc(db, "comunidades_membros", `${triboId}_${usuarioId}`);
        try {
            await deleteDoc(membroRef);
        } catch {
            // Silêncio se não existir
        }

        console.log(`Sucesso: Usuário ${usuarioId} saiu da tribo ${triboId}.`);
        return { sucesso: true, ehMembro: false };
    } catch (error) {
        console.error("Erro ao sair da tribo:", error.message);
        return { sucesso: false, erro: error.message };
    }
}

/**
 * 🔄 ALTERNAR PARTICIPAÇÃO: Entra se não for membro, ou sai se já for membro
 */
export async function alternarParticipacaoTribo(usuarioId, triboId) {
    try {
        if (!usuarioId || !triboId) return { sucesso: false };
        const docRef = doc(db, "comunidades", triboId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const dados = snap.data();
            const membros = dados.membros || [];
            if (membros.includes(usuarioId)) {
                return await sairDaTribo(usuarioId, triboId);
            } else {
                return await entrarNaTribo(usuarioId, triboId);
            }
        } else {
            return await entrarNaTribo(usuarioId, triboId);
        }
    } catch (error) {
        console.error("Erro ao alternar participação:", error.message);
        return { sucesso: false, erro: error.message };
    }
}

/**
 * ➕ CRIAR NOVA TRIBO NO FIRESTORE
 */
export async function criarTriboNoBanco({ id, nome, descricao, icone_emoji, criador_id, categoria }) {
    try {
        const triboId = id || `tribo_${Date.now()}`;
        const docRef = doc(db, "comunidades", triboId);
        const payload = {
            id: triboId,
            nome: nome.trim(),
            descricao: descricao.trim(),
            emblema: icone_emoji || "🪐",
            icone_emoji: icone_emoji || "🪐",
            categoria: categoria || "Criada pela Tribo",
            criador_id: criador_id || "anonimo",
            membros: [criador_id || "fundador"],
            membros_count: 1,
            data_criacao: new Date().toISOString()
        };

        await setDoc(docRef, payload);
        console.log(`Tribo criada no Firestore com sucesso: ${triboId}`);
        return { sucesso: true, id: triboId, tribo: payload };
    } catch (error) {
        console.error("Erro ao criar tribo no banco:", error.message);
        return { sucesso: false, erro: error.message };
    }
}

/**
 * 📡 ESCUTAR TRIBOS DO BANCO EM TEMPO REAL
 */
export function escutarTribosDoBanco(callback) {
    try {
        const q = query(collection(db, "comunidades"), orderBy("data_criacao", "desc"));
        return onSnapshot(q, (snapshot) => {
            const lista = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                lista.push({
                    id: docSnap.id,
                    ...data,
                    name: data.nome || data.name,
                    description: data.descricao || data.description,
                    avatar: data.emblema || data.icone_emoji || data.avatar || "🪐",
                    category: data.categoria || data.category || "Geral",
                    memberCount: String(data.membros_count || (data.membros ? data.membros.length : 1))
                });
            });
            callback(lista);
        }, (err) => {
            console.warn("Aviso na escuta de tribos:", err);
            callback([]);
        });
    } catch (error) {
        console.error("Erro ao escutar tribos:", error);
        callback([]);
        return () => {};
    }
}
