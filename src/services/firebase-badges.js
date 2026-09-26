// 🪐 Tribbu'sVibe - Sistema de Notificações por Badges (Realtime)
// Arquivo: firebase-badges.js

import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, writeBatch, addDoc } from "firebase/firestore";
import { db } from "./tribbusFirebase.js";

/**
 * 🔄 ESCUTAR BADGES: Conta quantas notificações não lidas o usuário tem e atualiza o menu
 * @param {string} usuarioLogadoId - UID do usuário dono da sessão
 * @param {string} tipoNotificacao - 'chat' ou 'scrap'
 * @param {Function} callbackAtualizarTela - Função que bota o número na bolinha neon do HTML
 * @returns {Function|null} Unsubscribe listener function
 */
export function escutarBadgesNotificacao(usuarioLogadoId, tipoNotificacao, callbackAtualizarTela) {
    if (!usuarioLogadoId) {
        console.warn("escutarBadgesNotificacao: usuarioLogadoId não fornecido.");
        return null;
    }

    try {
        // Busca notificações que pertencem ao usuário, do tipo escolhido e que estão como NÃO lidas
        const consultaBadges = query(
            collection(db, "notificacoes_usuario"),
            where("destinatario_id", "==", usuarioLogadoId),
            where("tipo", "==", tipoNotificacao),
            where("lida", "==", false)
        );

        // Ouve em tempo real. Se chegar mensagem, o tamanho do snapshot muda e o número sobe na hora!
        return onSnapshot(consultaBadges, (snapshot) => {
            const totalNaoLidas = snapshot.size;
            if (typeof callbackAtualizarTela === "function") {
                callbackAtualizarTela(totalNaoLidas, snapshot);
            }
        }, (error) => {
            console.error("Erro na escuta de badges:", error);
        });
    } catch (error) {
        console.error("Erro ao escutar badges de notificação:", error.message);
        return null;
    }
}

/**
 * 🧼 LIMPAR BADGE: Marca todas as notificações daquele tipo como lidas (quando o usuário abre o chat/mural)
 * @param {string} usuarioLogadoId - UID do usuário
 * @param {string} tipoNotificacao - 'chat' ou 'scrap'
 * @param {object} [snapshotAtual] - QuerySnapshot opcional já retornado pelo onSnapshot
 */
export async function limparBadgesDoTipo(usuarioLogadoId, tipoNotificacao, snapshotAtual) {
    try {
        if (snapshotAtual && typeof snapshotAtual.forEach === "function") {
            const promessas = [];
            snapshotAtual.forEach((documento) => {
                const docRef = doc(db, "notificacoes_usuario", documento.id);
                promessas.push(updateDoc(docRef, { lida: true }));
            });
            await Promise.all(promessas);
        } else if (usuarioLogadoId) {
            // Busca diretamente no Firestore caso o snapshot não tenha sido passado
            const consulta = query(
                collection(db, "notificacoes_usuario"),
                where("destinatario_id", "==", usuarioLogadoId),
                where("tipo", "==", tipoNotificacao),
                where("lida", "==", false)
            );
            const snapshot = await getDocs(consulta);
            if (!snapshot.empty) {
                const batch = writeBatch(db);
                snapshot.forEach((documento) => {
                    const docRef = doc(db, "notificacoes_usuario", documento.id);
                    batch.update(docRef, { lida: true });
                });
                await batch.commit();
            }
        }
        console.log(`Badges de ${tipoNotificacao} limpas com sucesso.`);
    } catch (error) {
        console.error("Erro ao limpar badges:", error.message);
    }
}

/**
 * 📢 CRIAR NOTIFICAÇÃO: Gera uma notificação para um usuário específico
 * @param {string} destinatarioId - UID de quem vai receber o badge
 * @param {string} remetenteId - UID ou nome de quem enviou
 * @param {'chat'|'scrap'} tipo - Tipo da notificação
 * @param {string} texto - Prévia da mensagem ou scrap
 */
export async function criarNotificacao(destinatarioId, remetenteId, tipo = "chat", texto = "") {
    try {
        if (!destinatarioId) return;
        const docRef = await addDoc(collection(db, "notificacoes_usuario"), {
            destinatario_id: destinatarioId,
            remetente_id: remetenteId || "anonimo",
            tipo: tipo,
            texto: texto || "",
            lida: false,
            criado_em: new Date().toISOString()
        });
        return { sucesso: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao criar notificação:", error);
        return { sucesso: false, erro: error.message };
    }
}

/**
 * 🏷️ CONECTAR BADGE AO HTML: Injeta e atualiza automaticamente o badge neon num botão/link
 * @param {HTMLElement|string} elementoOuSeletor - Elemento DOM ou seletor CSS (ex: '#btn-chat' ou link)
 * @param {string} usuarioLogadoId - UID do usuário
 * @param {'chat'|'scrap'} tipoNotificacao - Tipo
 */
export function conectarBadgeAoElemento(elementoOuSeletor, usuarioLogadoId, tipoNotificacao) {
    const el = typeof elementoOuSeletor === "string" 
        ? document.querySelector(elementoOuSeletor) 
        : elementoOuSeletor;
    
    if (!el) return null;

    // Procura ou cria badge embutida
    let badge = el.querySelector(`.badge-neon-${tipoNotificacao}`);
    if (!badge) {
        badge = document.createElement("span");
        badge.className = `badge-neon-${tipoNotificacao}`;
        badge.style.cssText = `
            display: none;
            background: #FF1493;
            color: #FFFFFF;
            font-size: 0.72rem;
            font-weight: 900;
            padding: 2px 7px;
            border-radius: 50px;
            margin-left: 6px;
            box-shadow: 0 0 8px rgba(255, 20, 147, 0.7);
            vertical-align: middle;
            transition: all 0.2s ease-in-out;
        `;
        el.appendChild(badge);
    }

    let snapshotSalvo = null;

    const unsubscribe = escutarBadgesNotificacao(usuarioLogadoId, tipoNotificacao, (total, snapshot) => {
        snapshotSalvo = snapshot;
        if (total > 0) {
            badge.textContent = total > 99 ? "99+" : String(total);
            badge.style.display = "inline-block";
        } else {
            badge.style.display = "none";
        }
    });

    // Ao clicar no elemento, limpa automaticamente as notificações
    el.addEventListener("click", () => {
        limparBadgesDoTipo(usuarioLogadoId, tipoNotificacao, snapshotSalvo);
    });

    return unsubscribe;
}
