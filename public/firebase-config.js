// 🪐 Tribbu'sVibe - Configuração e Módulos do Firebase
// Arquivo: firebase-config.js

import { 
  app, 
  db, 
  auth, 
  cadastrarUsuario as cadastrarUsuarioFirestore, 
  postarMicroVibe as postarMicroVibeFirestore,
  ouvirFeedEmTempoReal,
  curtirPost
} from './tribbusFirebase.js';

import { 
  salvarConfiguracoesPerfil, 
  buscarDadosConfiguracao 
} from './firebase-configuracoes.js';

import {
  lancarNovoTopico,
  escutarTopicosDaTribo
} from './firebase-forum.js';

import {
  enviarRespostaTopico,
  escutarRespostasDoTopico
} from './firebase-respostas.js';

import { 
  getFirestore, 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  collection 
} from 'firebase/firestore';

import { 
  realizarCadastro, 
  realizarLogin, 
  realizarLogout, 
  escutarEstadoAutenticacao, 
  obterUsuarioAtual 
} from './firebase-auth-login.js';

/**
 * 📢 Posta micro-vibe no feed aceitando formato posicional ou objeto:
 * - postarMicroVibe(meuUID, meuNome, texto)
 * - postarMicroVibe({ autor_id, autor_nome, conteudo_texto, ... })
 */
async function postarMicroVibe(autorOuObjeto, autorNome, conteudoTexto, imagemUrl = null) {
  if (typeof autorOuObjeto === 'string') {
    return await postarMicroVibeFirestore({
      autor_id: autorOuObjeto,
      autor_nome: autorNome || 'Membro Vibe',
      conteudo_texto: conteudoTexto || '',
      imagem_url: imagemUrl
    });
  } else if (autorOuObjeto && typeof autorOuObjeto === 'object') {
    return await postarMicroVibeFirestore(autorOuObjeto);
  }
  throw new Error('Parâmetros inválidos para postar micro-vibe.');
}

/**
 * 📡 Escuta feed em tempo real (compatível com app-feed.js)
 */
function escutarFeedTempoReal(callback, limite = 30) {
  return ouvirFeedEmTempoReal(callback, limite);
}

/**
 * 🌟 Função híbrida de cadastro de usuário:
 * - Se chamada com 4 parâmetros (nome, email, senha, dataNascimento) como no app.js:
 *   Cria a credencial no Firebase Authentication e grava o documento no Firestore.
 * - Se chamada com 1 objeto ({ id, nome, email, ... }):
 *   Grava diretamente o perfil na coleção 'usuarios' do Firestore.
 */
async function cadastrarUsuario(primeiroArg, email, senha, dataNascimento) {
  if (typeof primeiroArg === 'string') {
    // Chamada estilo app.js: cadastrarUsuario(nome, email, senha, dataNascimento)
    return await realizarCadastro(primeiroArg, email, senha, dataNascimento);
  } else if (primeiroArg && typeof primeiroArg === 'object') {
    // Chamada com objeto de dados do perfil para o Firestore
    try {
      const res = await cadastrarUsuarioFirestore(primeiroArg);
      return { sucesso: true, dados: res };
    } catch (err) {
      return { sucesso: false, erro: err?.message || String(err) };
    }
  }
  return { sucesso: false, erro: 'Parâmetros inválidos para cadastrar o usuário na tribo.' };
}

import { 
  postarStoryComunidade, 
  escutarStoriesAtivos 
} from './firebase-stories.js';

export {
  app,
  db,
  auth,
  cadastrarUsuario,
  postarMicroVibe,
  curtirPost,
  postarStoryComunidade,
  escutarStoriesAtivos,
  getFirestore,
  doc,
  updateDoc,
  increment,
  realizarLogin,
  realizarCadastro,
  realizarLogout,
  escutarEstadoAutenticacao,
  obterUsuarioAtual,
  escutarFeedTempoReal,
  salvarConfiguracoesPerfil,
  buscarDadosConfiguracao,
  lancarNovoTopico,
  escutarTopicosDaTribo,
  enviarRespostaTopico,
  escutarRespostasDoTopico
};

export default {
  app,
  db,
  auth,
  cadastrarUsuario,
  postarMicroVibe,
  curtirPost,
  postarStoryComunidade,
  escutarStoriesAtivos,
  escutarFeedTempoReal,
  realizarLogin,
  realizarCadastro,
  realizarLogout
};
