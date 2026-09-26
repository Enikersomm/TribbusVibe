// 🪐 Tribbu'sVibe - Sistema de Autenticação e Login Seguro
// Arquivo: firebase-auth-login.ts

import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  type User 
} from 'firebase/auth';
import { auth, cadastrarUsuario } from './tribbusFirebase';
import RotasTribbusVibe from './rotas-navegacao';

export interface RespostaAuth {
  sucesso: boolean;
  user?: User;
  erro?: string;
}

/**
 * 🔓 FUNÇÃO DE LOGIN: Autentica o usuário e redireciona para a Home do Tribbu'sVibe
 */
export async function realizarLogin(email: string, senha: string): Promise<RespostaAuth> {
  try {
    const cleanEmail = email.trim();
    if (!cleanEmail || !senha) {
      return { sucesso: false, erro: 'Informe e-mail e senha para entrar na vibe.' };
    }

    // O Firebase faz a checagem segura nos servidores do Google
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, senha);
    const user = userCredential.user;

    console.log("Login efetuado com sucesso! UID:", user.uid);
    
    // Dispara a rota automática que leva o fundador direto para o Feed
    RotasTribbusVibe.irParaHome();
    
    return { sucesso: true, user };
  } catch (error: any) {
    console.error("Erro ao tentar entrar no Tribbu'sVibe:", error?.message || error);
    
    // Tratamento de erros amigável para a interface
    let mensagemErro = "E-mail ou senha incorretos. Verifique suas credenciais.";
    const code = error?.code || '';

    if (code === "auth/user-not-found") {
      mensagemErro = "Este e-mail não está cadastrado na nossa tribo.";
    } else if (code === "auth/wrong-password") {
      mensagemErro = "Senha incorreta. Tente novamente.";
    } else if (code === "auth/invalid-credential") {
      mensagemErro = "E-mail ou senha incorretos. Confira se digitou certinho!";
    } else if (code === "auth/invalid-email") {
      mensagemErro = "Formato de e-mail inválido. Digite um e-mail válido.";
    } else if (code === "auth/too-many-requests") {
      mensagemErro = "Muitas tentativas sem sucesso. Aguarde alguns instantes e tente de novo.";
    } else if (code === "auth/network-request-failed") {
      mensagemErro = "Falha de conexão com os servidores. Verifique sua internet.";
    }
    
    return { sucesso: false, erro: mensagemErro };
  }
}

/**
 * ✨ FUNÇÃO DE CADASTRO: Cria nova conta segura no Firebase e inicializa o perfil no Firestore
 */
export async function realizarCadastro(
  nome: string,
  email: string,
  senha: string,
  dataNascimento: string = ''
): Promise<RespostaAuth> {
  try {
    const cleanNome = nome.trim();
    const cleanEmail = email.trim();

    if (!cleanNome) {
      return { sucesso: false, erro: 'Por favor, informe seu nome ou apelido.' };
    }
    if (!cleanEmail || !senha) {
      return { sucesso: false, erro: 'Preencha todos os campos para fazer parte da comu.' };
    }
    if (senha.length < 6) {
      return { sucesso: false, erro: 'A senha precisa ter pelo menos 6 caracteres.' };
    }

    // Cria o usuário seguro no Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, senha);
    const user = userCredential.user;

    // Atualiza o nome de exibição no Firebase Auth
    try {
      await updateProfile(user, {
        displayName: cleanNome
      });
    } catch (profileErr) {
      console.warn('Aviso ao atualizar displayName no Auth:', profileErr);
    }

    // Registra o perfil na coleção 'usuarios' do Firestore
    try {
      await cadastrarUsuario({
        id: user.uid,
        nome: cleanNome,
        email: cleanEmail,
        data_nascimento: dataNascimento,
        status_vibe: 'Cheguei no Tribbu\'sVibe! Sintonizando novas frequências ✨',
        bio: `Membro novinho na tribo. Criei minha conta pelo portal oficial.`,
        medidor_confiavel: 100,
        medidor_legal: 100,
        medidor_vibe: 100
      });
    } catch (dbErr) {
      console.warn('Aviso ao sincronizar documento do usuário no Firestore:', dbErr);
    }

    console.log("Cadastro efetuado com sucesso! UID:", user.uid);

    // Dispara a rota automática que leva o novo membro para a Home
    RotasTribbusVibe.irParaHome();

    return { sucesso: true, user };
  } catch (error: any) {
    console.error("Erro ao cadastrar no Tribbu'sVibe:", error?.message || error);

    let mensagemErro = "Não foi possível concluir seu cadastro. Tente novamente.";
    const code = error?.code || '';

    if (code === "auth/email-already-in-use") {
      mensagemErro = "Este e-mail já está cadastrado na nossa tribo. Faça login!";
    } else if (code === "auth/invalid-email") {
      mensagemErro = "O e-mail informado é inválido.";
    } else if (code === "auth/weak-password") {
      mensagemErro = "A senha é muito fraca. Digite pelo menos 6 caracteres.";
    } else if (code === "auth/operation-not-allowed") {
      mensagemErro = "O provedor de e-mail/senha precisa ser habilitado no Firebase Console.";
    }

    return { sucesso: false, erro: mensagemErro };
  }
}

/**
 * 🚪 FUNÇÃO DE LOGOUT: Encerra a sessão e manda de volta para a tela de acesso
 */
export async function realizarLogout(): Promise<void> {
  try {
    await signOut(auth);
    console.log("Sessão encerrada na maior tranquilidade.");
    RotasTribbusVibe.irParaAcesso();
  } catch (error: any) {
    console.error("Erro ao sair do app:", error?.message || error);
    // Mesmo com erro de rede no signOut, redireciona para acesso
    RotasTribbusVibe.irParaAcesso();
  }
}

/**
 * 👂 Monitora o estado de autenticação em tempo real
 */
export function escutarEstadoAutenticacao(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * 👤 Retorna o usuário logado no momento
 */
export function obterUsuarioAtual(): User | null {
  return auth.currentUser;
}

export default {
  realizarLogin,
  realizarCadastro,
  realizarLogout,
  escutarEstadoAutenticacao,
  obterUsuarioAtual
};
