// 🪐 Tribbu'sVibe - Lógica dos Stories das Comunidades (Tempo Real)
// Arquivo: firebase-stories.js

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "./tribbusFirebase.js";
import { redimensionarEComprimirImagem } from "./firebase-storage.js";

/**
 * 🚀 POSTAR STORY: Envia uma imagem/conteúdo temporário (foto, texto neon ou música) para dentro de uma Tribo
 */
export async function postarStoryComunidade(usuarioId, comunidadeId, imagemUrl, options = {}) {
    try {
        let urlSegura = imagemUrl || '';
        // Previne estourar o limite de 1MB do documento no Firestore
        if (urlSegura && typeof urlSegura === 'string' && urlSegura.startsWith('data:image')) {
            urlSegura = await redimensionarEComprimirImagem(urlSegura, 1080, 0.72);
        }

        const tipoVibe = options.tipo || (urlSegura ? 'foto' : (options.texto_vibe ? 'texto' : (options.trilha_musica ? 'musica' : 'foto')));

        const docRef = await addDoc(collection(db, "comunidades_stories"), {
            autor_id: usuarioId || "anonimo",
            autor_nome: options.autor_nome || "Membro da Tribo",
            autor_avatar: options.autor_avatar || "",
            comunidade_id: comunidadeId || "geral",
            comunidade_nome: options.comunidade_nome || "Tribo",
            tipo: tipoVibe,
            media_url: urlSegura,
            texto_vibe: options.texto_vibe || "",
            trilha_musica: options.trilha_musica || "",
            data_criacao: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Calcula 24 horas exatas no futuro!
        });
        console.log("Story lançado no Mural com sucesso! ID:", docRef.id);
        return { sucesso: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao postar story na comunidade:", error.message);
        return { sucesso: false, erro: error.message };
    }
}

/**
 * 💬 ADICIONAR COMENTÁRIO NO STORY: Envia uma mensagem em tempo real para a vibe do story
 * @param {string} storyId - ID do story na coleção comunidades_stories
 * @param {string} autorId - UID do usuário que comentou
 * @param {string} autorNome - Nome de exibição (@membro ou nome)
 * @param {string} conteudoTexto - Conteúdo da mensagem
 */
export async function adicionarComentarioNoStory(storyId, autorId, autorNome, conteudoTexto) {
    try {
        if (!storyId || !conteudoTexto.trim()) {
            return { sucesso: false, erro: "StoryId e texto são obrigatórios." };
        }

        const docRef = await addDoc(collection(db, "comunidades_stories", storyId, "comentarios"), {
            autor_id: autorId || "anonimo",
            autor_name: autorNome || "Membro da Tribo",
            conteudo_texto: conteudoTexto.trim(),
            criado_em: new Date().toISOString()
        });

        return { sucesso: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao adicionar comentário no story:", error.message);
        return { sucesso: false, erro: error.message };
    }
}

/**
 * 🔄 ESCUTAR COMENTÁRIOS DO STORY: Ouve em tempo real as reações e comentários de um story específico
 * @param {string} storyId - ID do story selecionado
 * @param {Function} callbackComentarios - Callback que recebe a lista de comentários ordenada
 * @returns {Function|null} Unsubscribe listener
 */
export function escutarComentariosDoStory(storyId, callbackComentarios) {
    if (!storyId) {
        console.warn("escutarComentariosDoStory: storyId não informado.");
        return () => {};
    }

    try {
        const consultaComentarios = query(
            collection(db, "comunidades_stories", storyId, "comentarios"),
            orderBy("criado_em", "asc")
        );

        return onSnapshot(consultaComentarios, (snapshot) => {
            const comentarios = [];
            snapshot.forEach((docSnap) => {
                comentarios.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });
            if (typeof callbackComentarios === "function") {
                callbackComentarios(comentarios);
            }
        }, (error) => {
            console.error("Erro ao escutar comentários do story:", error);
        });
    } catch (error) {
        console.error("Erro ao configurar ouvinte de comentários do story:", error.message);
        return () => {};
    }
}

/**
 * 🪐 ABRIR VIBE COM COMENTÁRIOS: Exemplo prático da interface nos bastidores
 * Abre o ouvinte em tempo real para aquela bolinha específica e injeta na paleta de alto impacto
 * @param {string} storyIDSelecionado - ID do story selecionado
 * @returns {Function} Unsubscribe listener do modal
 */
export function abrirVibeComComentarios(storyIDSelecionado) {
    // Abre o ouvinte em tempo real para aquela bolinha específica
    return escutarComentariosDoStory(storyIDSelecionado, (comentarios) => {
        const containerListaModal = document.querySelector(".modal-comentarios-area");
        if (!containerListaModal) return;

        containerListaModal.innerHTML = ""; // Reseta o painel visual
        
        if (comentarios.length === 0) {
            containerListaModal.innerHTML = `
                <div style="text-align: center; color: var(--texto-suave, #9AA0A6); font-size: 0.85rem; padding: 15px 0; font-style: italic;">
                    Nenhum comentário nesta Vibe ainda. Seja o primeiro a comentar! ✨
                </div>
            `;
            return;
        }

        comentarios.forEach(com => {
            // Injeta o HTML dos comentários com bordas e fontes na nossa paleta de alto impacto
            const autor = escapeStoryHTML(com.autor_name || "Membro da Tribo");
            const texto = escapeStoryHTML(com.conteudo_texto || "");
            containerListaModal.innerHTML += `
                <div style="background: var(--cinza-input, #1E1E24); padding: 10px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid var(--pink-magenta, #FF007F);">
                    <strong style="color: var(--ciano-neon, #00F0FF); font-size: 0.85rem;">${autor}</strong>
                    <p style="font-size: 0.9rem; color: #FFF; margin-top: 2px; word-break: break-word;">${texto}</p>
                </div>
            `;
        });
    });
}

function escapeStoryHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * 🔄 ESCUTAR STORIES: Monitora e traz apenas os stories postados nas últimas 24 horas
 */
export function escutarStoriesAtivos(callbackDesenharStories) {
    try {
        const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Filtramos no banco: traz apenas posts onde a 'data_criacao' é MAIOR que as últimas 24 horas
        const consultaStories = query(
            collection(db, "comunidades_stories"),
            where("data_criacao", ">=", vinteQuatroHorasAtras),
            orderBy("data_criacao", "desc")
        );

        return onSnapshot(
            consultaStories, 
            (snapshot) => {
                const storiesVivos = [];
                snapshot.forEach((doc) => {
                    storiesVivos.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                // Retorna as bolinhas atualizadas para o topo do feed HTML
                callbackDesenharStories(storiesVivos);
            },
            (err) => {
                console.warn("Aviso ao escutar consulta com filtro de stories (tentando fallback local):", err.message);
                // Fallback para caso ainda não haja índice composto criado no Firestore
                try {
                    const fallbackQuery = query(
                        collection(db, "comunidades_stories"),
                        orderBy("data_criacao", "desc")
                    );
                    return onSnapshot(fallbackQuery, (snapshot) => {
                        const storiesVivos = [];
                        snapshot.forEach((doc) => {
                            const data = doc.data();
                            if (data.data_criacao >= vinteQuatroHorasAtras) {
                                storiesVivos.push({
                                    id: doc.id,
                                    ...data
                                });
                            }
                        });
                        callbackDesenharStories(storiesVivos);
                    });
                } catch (fallbackErr) {
                    console.error("Erro no fallback de stories:", fallbackErr);
                }
            }
        );
    } catch (error) {
        console.error("Erro ao escutar stories das tribos:", error.message);
        return () => {};
    }
}

export const escutarStoriesComunidade = escutarStoriesAtivos;

export default {
    postarStoryComunidade,
    escutarStoriesAtivos,
    escutarStoriesComunidade,
    adicionarComentarioNoStory,
    escutarComentariosDoStory,
    abrirVibeComComentarios
};
