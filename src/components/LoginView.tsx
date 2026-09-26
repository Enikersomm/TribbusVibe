import React, { useState } from 'react';
import { Sparkles, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { AnimatedLogo } from './AnimatedLogo';
import { useAppLogo } from '../utils/logo';
import { realizarLogin, realizarCadastro } from '../services/firebase-auth-login';

interface LoginViewProps {
  onLogin: (userName?: string, userEmail?: string) => void;
  onOpen404?: () => void;
  onOpenTribos?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onOpen404, onOpenTribos }) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerBirthdate, setRegisterBirthdate] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  const { logoSrc, isCustom } = useAppLogo();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await realizarLogin(loginEmail, loginPassword);
      if (res.sucesso && res.user) {
        const displayName = res.user.displayName || loginEmail.split('@')[0] || 'Membro Vibe';
        onLogin(displayName, res.user.email || loginEmail);
      } else {
        setLoginError(res.erro || 'Falha ao autenticar.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Erro inesperado ao realizar login.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);
    setRegisterLoading(true);

    try {
      const res = await realizarCadastro(
        registerName,
        registerEmail,
        registerPassword,
        registerBirthdate
      );

      if (res.sucesso && res.user) {
        setRegisterSuccess('Cadastro realizado com sucesso! Entrando na vibe...');
        setTimeout(() => {
          onLogin(registerName || 'Novo Membro', registerEmail);
        }, 800);
      } else {
        setRegisterError(res.erro || 'Erro ao realizar cadastro.');
      }
    } catch (err: any) {
      setRegisterError(err?.message || 'Erro inesperado ao cadastrar.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white flex flex-col items-center justify-between p-4 sm:p-8 font-sans selection:bg-[#FF007F] selection:text-white">
      
      {/* Topo com a Logo Sem Fundo e Poeira Cósmica Orbitando */}
      <div className="header-container text-center mt-2 mb-4 flex flex-col items-center">
        <AnimatedLogo size="normal" />
      </div>

      {/* Container Principal do Site em duas colunas com Borda de Supremo Neon */}
      <main className="w-full max-w-[1000px] bg-[#121214] rounded-[28px] p-7 sm:p-11 shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative border border-transparent flex flex-col md:flex-row gap-8 lg:gap-10 before:content-[''] before:absolute before:-top-[2px] before:-left-[2px] before:-right-[2px] before:-bottom-[2px] before:bg-[linear-gradient(135deg,#FF007F_0%,#9400D3_50%,#00F0FF_100%)] before:rounded-[30px] before:-z-10 before:opacity-60">
        
        {/* Coluna Esquerda: Slogan Oficial */}
        <section className="flex-1 flex flex-col justify-center pr-0 md:pr-4 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-black mb-4 leading-tight bg-[linear-gradient(135deg,#FF007F_0%,#9400D3_50%,#00F0FF_100%)] bg-clip-text text-transparent">
            Seu novo ponto de encontro.
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-[#9AA0A6] mb-6">
            Encontre suas comunidades de verdade, faça novos amigos e compartilhe sua rotina sem a pressão de algoritmos viciantes. Tudo na sua própria vibe.
          </p>
          
          <div className="bg-[#00F0FF]/5 p-4 rounded-[14px] border-l-5 border-[#00F0FF] font-bold text-sm sm:text-base text-white shadow-[0_0_15px_rgba(0,240,255,0.1)] flex flex-wrap items-center gap-2">
            <span>Membros no Tribbu&apos;sVibe hoje:</span>
            <span className="text-[#FF007F] font-black text-lg">1</span>
            <span className="text-xs sm:text-sm text-[#9AA0A6] font-semibold">
              (Você é o Fundador! 👑)
            </span>
          </div>
        </section>

        {/* Coluna Direita: Formulários de Alto Impacto */}
        <section className="flex-1 flex flex-col gap-6">
          
          {/* Formulário de Login */}
          <div className="form-box bg-white/[0.01] p-5 sm:p-6 rounded-[18px] border border-white/[0.04]">
            <h2 className="text-white text-lg font-bold mb-4 pb-2 border-b-2 border-[#FF007F]/30">
              Que bom te ver de volta!
            </h2>

            {loginError && (
              <div className="mb-4 p-3 bg-[#FF007F]/15 border border-[#FF007F] text-[#FFB3D1] text-xs font-semibold rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#FF007F] mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={loginLoading}
                  className="w-full p-3.5 border border-white/[0.08] rounded-xl text-sm bg-[#1E1E24] text-white focus:outline-none focus:border-[#00F0FF] focus:shadow-[0_0_10px_rgba(0,240,255,0.35)] transition-all disabled:opacity-60"
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={loginLoading}
                  className="w-full p-3.5 border border-white/[0.08] rounded-xl text-sm bg-[#1E1E24] text-white focus:outline-none focus:border-[#00F0FF] focus:shadow-[0_0_10px_rgba(0,240,255,0.35)] transition-all disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 bg-[linear-gradient(135deg,#FF007F_0%,#9400D3_50%,#00F0FF_100%)] hover:bg-[linear-gradient(135deg,#D1107A_0%,#7A00B3_50%,#00C2CC_100%)] disabled:opacity-70 text-white font-bold rounded-full text-sm sm:text-base cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,240,255,0.45)] shadow-[0_4px_15px_rgba(255,0,127,0.3)] flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entrando no Tribbu&apos;sVibe...</span>
                  </>
                ) : (
                  <span>Entrar no Tribbu&apos;sVibe</span>
                )}
              </button>
            </form>
          </div>

          {/* Formulário de Cadastro */}
          <div className="form-box bg-white/[0.01] p-5 sm:p-6 rounded-[18px] border border-white/[0.04]">
            <h2 className="text-white text-lg font-bold mb-4 pb-2 border-b-2 border-[#FF007F]/30">
              Faça parte da nossa comu
            </h2>

            {registerError && (
              <div className="mb-4 p-3 bg-[#FF007F]/15 border border-[#FF007F] text-[#FFB3D1] text-xs font-semibold rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#FF007F] mt-0.5" />
                <span>{registerError}</span>
              </div>
            )}

            {registerSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500 text-emerald-200 text-xs font-semibold rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{registerSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Nome Completo"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                  disabled={registerLoading}
                  className="w-full p-3.5 border border-white/[0.08] rounded-xl text-sm bg-[#1E1E24] text-white focus:outline-none focus:border-[#00F0FF] focus:shadow-[0_0_10px_rgba(0,240,255,0.35)] transition-all disabled:opacity-60"
                />
              </div>
              <div className="input-group">
                <input
                  type="email"
                  placeholder="E-mail"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  disabled={registerLoading}
                  className="w-full p-3.5 border border-white/[0.08] rounded-xl text-sm bg-[#1E1E24] text-white focus:outline-none focus:border-[#00F0FF] focus:shadow-[0_0_10px_rgba(0,240,255,0.35)] transition-all disabled:opacity-60"
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Crie uma Senha (mínimo 6 dígitos)"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  disabled={registerLoading}
                  className="w-full p-3.5 border border-white/[0.08] rounded-xl text-sm bg-[#1E1E24] text-white focus:outline-none focus:border-[#00F0FF] focus:shadow-[0_0_10px_rgba(0,240,255,0.35)] transition-all disabled:opacity-60"
                />
              </div>
              <div className="input-group">
                <input
                  type="date"
                  title="Data de Nascimento"
                  value={registerBirthdate}
                  onChange={(e) => setRegisterBirthdate(e.target.value)}
                  required
                  disabled={registerLoading}
                  className="w-full p-3.5 border border-white/[0.08] rounded-xl text-sm bg-[#1E1E24] text-white focus:outline-none focus:border-[#00F0FF] focus:shadow-[0_0_10px_rgba(0,240,255,0.35)] transition-all disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={registerLoading}
                className="w-full py-3.5 bg-[linear-gradient(135deg,#FF007F_0%,#9400D3_50%,#00F0FF_100%)] hover:bg-[linear-gradient(135deg,#D1107A_0%,#7A00B3_50%,#00C2CC_100%)] disabled:opacity-70 text-white font-bold rounded-full text-sm sm:text-base cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,240,255,0.45)] shadow-[0_4px_15px_rgba(255,0,127,0.3)] flex items-center justify-center gap-2"
              >
                {registerLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Criando sua conta...</span>
                  </>
                ) : (
                  <span>Começar Minha Jornada</span>
                )}
              </button>
            </form>
          </div>

        </section>

      </main>

      {/* Rodapé Oficial */}
      <footer className="mt-8 text-center text-xs text-[#888]">
        &copy; 2026 Tribbu&apos;sVibe Inc. — Conectando pessoas, ideias, e novas histórias! 🪐
      </footer>

    </div>
  );
};
