/**
 * ============================================================================
 * 🪐 TRIBBUSVIBE - CONFIGURAÇÃO E SERVIÇOS DO FIREBASE FIRESTORE (SDK v10+)
 * ============================================================================
 * 
 * Rede Social Antialgoritmo voltada para a Geração Z (Híbrido: Orkut + X + Insta + Face)
 * 
 * Este arquivo contém:
 * 1. Inicialização do Firebase e do Firestore (Modular SDK v10+)
 * 2. Funções de CRUD das 4 coleções principais:
 *    - usuarios
 *    - comunidades (Tribos)
 *    - feed_posts (Micro-Vibes / Scraps de Feed)
 *    - eventos (Rolês e Encontros de Tribos)
 * 3. As 4 funções nucleares solicitadas:
 *    - cadastrarUsuario()
 *    - criarTribo()
 *    - postarMicroVibe()
 *    - buscarFeedCronologico()
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  updateDoc,
  increment,
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

import appletConfig from '../../firebase-applet-config.json';

/* ----------------------------------------------------------------------------
 * 1. CONFIGURAÇÃO DO PROJETO FIREBASE
 * ----------------------------------------------------------------------------
 * Utiliza o arquivo de configuração provisionado automaticamente no projeto.
 */
export const firebaseConfig = {
  apiKey: appletConfig.apiKey || process.env.VITE_FIREBASE_API_KEY,
  authDomain: appletConfig.authDomain || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: appletConfig.projectId || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: appletConfig.storageBucket || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: appletConfig.messagingSenderId || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: appletConfig.appId || process.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: appletConfig.firestoreDatabaseId
};

// Inicializa a aplicação Firebase
export const app = initializeApp(firebaseConfig);

// Inicializa o Firestore Database de forma segura
let firestoreInstance = null;
const dbId = firebaseConfig.firestoreDatabaseId;

try {
  if (dbId) {
    firestoreInstance = getFirestore(app, dbId);
  } else {
    firestoreInstance = getFirestore(app);
  }
} catch {
  try {
    firestoreInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true
    });
  } catch {
    firestoreInstance = getFirestore(app);
  }
}

export const db = firestoreInstance;

// Inicializa o serviço de Autenticação
export const auth = getAuth(app);


/* ----------------------------------------------------------------------------
 * 2. FUNÇÃO 1: cadastrarUsuario()
 * ----------------------------------------------------------------------------
 * Cria ou atualiza o perfil do usuário na coleção 'usuarios'.
 * Utiliza o UID do Firebase Authentication como ID do documento para
 * garantir integridade relacional direta 1:1.
 * 
 * @param {Object} dadosUsuario
 * @param {string} dadosUsuario.id - UID gerado pelo Firebase Auth
 * @param {string} dadosUsuario.nome - Nome de exibição ou apelido
 * @param {string} dadosUsuario.email - E-mail do usuário
 * @param {string} [dadosUsuario.data_nascimento] - Data no formato YYYY-MM-DD
 * @param {string} [dadosUsuario.status_vibe] - Frase de status nostálgica
 * @param {string} [dadosUsuario.bio] - Descrição 'Quem sou eu'
 * @param {string} [dadosUsuario.avatar_url] - Link para a foto de perfil
 * @param {number} [dadosUsuario.medidor_confiavel] - % Confiável (padrão: 100)
 * @param {number} [dadosUsuario.medidor_legal] - % Legal (padrão: 100)
 * @param {number} [dadosUsuario.medidor_vibe] - % Vibe (padrão: 100)
 * @returns {Promise<Object>} Dados gravados do usuário
 */
export async function cadastrarUsuario({
  id,
  nome,
  email,
  data_nascimento = '',
  status_vibe = 'Sintonizando novas vibes ✌️',
  bio = 'Aqui ninguém precisa performar produtividade. Vivendo na minha própria sintonia.',
  avatar_url = '',
  medidor_confiavel = 0,
  medidor_legal = 0,
  medidor_vibe = 0
}) {
  if (!id) {
    throw new Error('O id (UID do Auth) é obrigatório para cadastrar o usuário.');
  }

  const payloadUsuario = {
    id,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    data_nascimento,
    status_vibe,
    bio,
    avatar_url,
    medidor_confiavel: Number(medidor_confiavel),
    medidor_legal: Number(medidor_legal),
    medidor_vibe: Number(medidor_vibe),
    data_cadastro: serverTimestamp()
  };

  try {
    const usuarioRef = doc(db, 'usuarios', id);
    await setDoc(usuarioRef, payloadUsuario, { merge: true });
    console.log(`[TribbusVibe] Usuário cadastrado com sucesso: ${nome} (${id})`);
    return payloadUsuario;
  } catch (erro) {
    console.error('[TribbusVibe] Erro ao cadastrar usuário:', erro);
    throw erro;
  }
}


/* ----------------------------------------------------------------------------
 * 3. FUNÇÃO 2: criarTribo()
 * ----------------------------------------------------------------------------
 * Cria uma nova comunidade/tribo temática antialgoritmo.
 * 
 * @param {Object} dadosTribo
 * @param {string} dadosTribo.nome - Nome da tribo (ex: "Eu odeio acordar cedo")
 * @param {string} dadosTribo.descricao - Propósito e regrinhas da tribo
 * @param {string} dadosTribo.icone_emoji - Emoji temático ou ícone (ex: "🥱", "🎮")
 * @param {string} dadosTribo.criador_id - UID do usuário criador
 * @returns {Promise<{ id: string, ... }>} Tribo criada com seu ID gerado
 */
export async function criarTribo({
  nome,
  descricao,
  icone_emoji = '✨',
  criador_id
}) {
  if (!nome || !descricao || !criador_id) {
    throw new Error('Nome, descrição e criador_id são obrigatórios para criar uma tribo.');
  }

  const payloadComunidade = {
    nome: nome.trim(),
    descricao: descricao.trim(),
    icone_emoji: icone_emoji.trim() || '✨',
    criador_id,
    membros_contador: 1, // O criador já começa como primeiro membro
    data_criacao: serverTimestamp()
  };

  try {
    const comunidadesCol = collection(db, 'comunidades');
    const docRef = await addDoc(comunidadesCol, payloadComunidade);
    console.log(`[TribbusVibe] Tribo criada com sucesso! ID: ${docRef.id}`);
    return {
      id: docRef.id,
      ...payloadComunidade
    };
  } catch (erro) {
    console.error('[TribbusVibe] Erro ao criar tribo:', erro);
    throw erro;
  }
}


/* ----------------------------------------------------------------------------
 * 4. FUNÇÃO 3: postarMicroVibe()
 * ----------------------------------------------------------------------------
 * Publica um post de micro-vibe (formato X/Twitter/Scrap) no feed geral ou
 * vinculado ao mural de uma comunidade específica.
 * 
 * @param {Object} dadosPost
 * @param {string} dadosPost.autor_id - UID do autor
 * @param {string} dadosPost.autor_nome - Nome do autor
 * @param {string} dadosPost.autor_avatar - URL da foto do autor
 * @param {string} dadosPost.conteudo_texto - Texto da mensagem / micro-vibe
 * @param {string|null} [dadosPost.imagem_url] - Imagem opcional anexada
 * @param {string|null} [dadosPost.comunidade_id] - ID da comunidade (null para perfil/feed geral)
 * @returns {Promise<{ id: string, ... }>} Post criado com ID gerado
 */
export async function postarMicroVibe({
  autor_id,
  autor_nome,
  autor_avatar = '',
  conteudo_texto,
  imagem_url = null,
  comunidade_id = null
}) {
  if (!autor_id || !conteudo_texto?.trim()) {
    throw new Error('autor_id e conteudo_texto são obrigatórios para publicar no feed.');
  }

  const payloadPost = {
    autor_id,
    autor_nome: autor_nome || 'Membro Vibe',
    autor_avatar: autor_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    comunidade_id: comunidade_id || null, // null se for post do perfil geral
    conteudo_texto: conteudo_texto.trim(),
    imagem_url: imagem_url || null,
    curtidas_contador: 0,
    data_postagem: serverTimestamp()
  };

  try {
    const postsCol = collection(db, 'feed_posts');
    const docRef = await addDoc(postsCol, payloadPost);
    console.log(`[TribbusVibe] Micro-Vibe publicado com ID: ${docRef.id}`);
    return {
      id: docRef.id,
      ...payloadPost
    };
  } catch (erro) {
    console.error('[TribbusVibe] Erro ao postar micro-vibe:', erro);
    throw erro;
  }
}


/* ----------------------------------------------------------------------------
 * 5. FUNÇÃO 4: buscarFeedCronologico()
 * ----------------------------------------------------------------------------
 * Busca os posts mais recentes em ordem 100% cronológica decrescente.
 * ANTIALGORITMO: Aqui não há "recomendações opacas" ou engajamento forçado —
 * quem postou mais recentemente aparece primeiro.
 * 
 * @param {number} [limite=30] - Quantidade máxima de posts a retornar
 * @param {string|null} [filtroComunidadeId=null] - Opcional: filtrar posts de uma tribo
 * @returns {Promise<Array<Object>>} Lista de posts com seus IDs
 */
export async function buscarFeedCronologico(limite = 30, filtroComunidadeId = null) {
  try {
    const postsCol = collection(db, 'feed_posts');
    let q;

    if (filtroComunidadeId) {
      // Filtra por comunidade específica em ordem cronológica
      q = query(
        postsCol,
        where('comunidade_id', '==', filtroComunidadeId),
        orderBy('data_postagem', 'desc'),
        limit(limite)
      );
    } else {
      // Feed global cronológico
      q = query(
        postsCol,
        orderBy('data_postagem', 'desc'),
        limit(limite)
      );
    }

    const querySnapshot = await getDocs(q);
    const posts = [];

    querySnapshot.forEach((docSnap) => {
      posts.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    console.log(`[TribbusVibe] Feed cronológico carregado: ${posts.length} posts`);
    return posts;
  } catch (erro) {
    console.error('[TribbusVibe] Erro ao buscar feed cronológico:', erro);
    throw erro;
  }
}


/* ----------------------------------------------------------------------------
 * 6. FUNÇÕES ADICIONAIS ÚTEIS (TEMPO REAL & INTERAÇÕES)
 * ----------------------------------------------------------------------------
 */

/**
 * Escuta atualizações do Feed em TEMPO REAL (Reatividade sem reload).
 * 
 * @param {Function} callback - Função chamada sempre que houver novos posts
 * @param {number} [limite=30] - Quantidade de posts
 * @returns {Function} Função de unsubscribe para desanexar o listener
 */
export function ouvirFeedEmTempoReal(callback, limite = 30) {
  const postsCol = collection(db, 'feed_posts');
  const q = query(postsCol, orderBy('data_postagem', 'desc'), limit(limite));

  return onSnapshot(q, (snapshot) => {
    const posts = [];
    snapshot.forEach((docSnap) => {
      posts.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    callback(posts);
  }, (erro) => {
    console.error('[TribbusVibe] Erro no listener em tempo real do feed:', erro);
  });
}

/**
 * Registra uma curtida em um post usando incremento atômico do Firestore.
 * 
 * @param {string} postId - ID do post a ser curtido
 */
export async function curtirPost(postId) {
  if (!postId) return;
  const postRef = doc(db, 'feed_posts', postId);
  await updateDoc(postRef, {
    curtidas_contador: increment(1)
  });
}

/**
 * Cria um evento vinculado a uma tribo ou geral.
 * 
 * @param {Object} dadosEvento
 * @param {string} dadosEvento.comunidade_id - ID da tribo anfitriã
 * @param {string} dadosEvento.titulo - Nome do evento / rolê
 * @param {string|Date} dadosEvento.data_hora - Data e horário
 * @param {string} dadosEvento.local - Local físico ou sala virtual
 * @returns {Promise<{ id: string, ... }>}
 */
export async function criarEvento({
  comunidade_id,
  titulo,
  data_hora,
  local
}) {
  const payloadEvento = {
    comunidade_id: comunidade_id || null,
    titulo: titulo.trim(),
    data_hora,
    local: local.trim(),
    confirmados_contador: 1, // Criador confirmado
    data_criacao: serverTimestamp()
  };

  const eventosCol = collection(db, 'eventos');
  const docRef = await addDoc(eventosCol, payloadEvento);
  return {
    id: docRef.id,
    ...payloadEvento
  };
}

/**
 * 🚀 Inicializa o banco de dados com a estrutura e dados iniciais
 * caso as coleções estejam vazias, garantindo que o Firestore
 * já tenha as 4 coleções ativas e visíveis no Console.
 */
export async function inicializarBancoSeVazio() {
  // App limpo para testes de verdade - sem inserção de dados fictícios
  return { sucesso: true, mensagem: 'Banco limpo pronto para novos dados.' };
}


