// 🪐 Tribbu'sVibe - Sistema de Chat Privado em Tempo Real (WhatsApp + MSN)
// Arquivo: firebase-chat.js

import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "./tribbusFirebase.js";

/**
 * 💬 ENVIAR MENSAGEM: Envia um texto privado ou dispara o comando de Chamar Atenção
 * @param {string} remetenteId - UID de quem envia
 * @param {string} destinatarioId - UID de quem recebe
 * @param {string} conteudoTexto - O texto da mensagem
 * @param {boolean} chamouAtencao - Se for 'true', ativa a animação de tremer a tela do amigo!
 */
export async function enviarMensagemPrivada(remetenteId, destinatarioId, conteudoTexto, chamouAtencao = false) {
    try {
        const docRef = await addDoc(collection(db, "chats_privados"), {
            remetente_id: remetenteId,
            destinatario_id: destinatarioId,
            conteudo_texto: conteudoTexto,
            is_atencao: chamouAtencao, // Marcador booleano para o efeito MSN
            data_envio: new Date().toISOString() // Organização cronológica perfeita
        });
        
        console.log("Mensagem privada enviada com sucesso no Tribbu'sVibe! ID:", docRef.id);
        return { sucesso: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao enviar mensagem no chat:", error?.message || error);
        return { sucesso: false, erro: error?.message || String(error) };
    }
}

/**
 * 🔄 ESCUTAR CONVERSA: Monitora as mensagens entre dois usuários específicos em tempo real
 * @param {string} usuarioLogadoId - UID do usuário que está mexendo no app
 * @param {string} amigoId - UID do amigo com quem ele está conversando
 * @param {Function} callbackDesenharChat - Função que renderiza os balões e treme a tela no HTML
 */
export function escutarChatEmTempoReal(usuarioLogadoId, amigoId, callbackDesenharChat) {
    try {
        // Criamos uma busca para trazer a conversa completa de ida e volta
        const consultaChat = query(
            collection(db, "chats_privados"),
            orderBy("data_envio", "asc") // Mais antigas primeiro para ler de cima para baixo
        );

        // O onSnapshot mantém a conexão em tempo real aberta com o Firebase
        return onSnapshot(consultaChat, (snapshot) => {
            const mensagensFiltradas = [];

            snapshot.forEach((doc) => {
                const dados = doc.data();
                
                // Filtro de segurança: pega apenas as mensagens trocadas ENTRE esses dois usuários
                const eDessesUsuarios = 
                    (dados.remetente_id === usuarioLogadoId && dados.destinatario_id === amigoId) ||
                    (dados.remetente_id === amigoId && dados.destinatario_id === usuarioLogadoId);

                if (eDessesUsuarios) {
                    mensagensFiltradas.push({
                        id: doc.id,
                        ...dados
                    });
                }
            });

            // Passa as mensagens filtradas para a nossa interface atualizar a tela na hora
            callbackDesenharChat(mensagensFiltradas);
        }, (err) => {
            console.warn("Aviso ao escutar chat em tempo real:", err?.message || err);
        });
    } catch (error) {
        console.error("Erro ao abrir escuta em tempo real do chat:", error?.message || error);
        return () => {};
    }
}
