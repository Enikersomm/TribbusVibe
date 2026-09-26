import React from 'react';
import { Sparkles, Search, Bell, LogOut, Heart, User, Compass, SlidersHorizontal, MessageCircle, Crown } from 'lucide-react';
import { UserProfile } from '../types';
import { useAppLogo } from '../utils/logo';
import { realizarLogout } from '../services/firebase-auth-login';

interface HeaderProps {
  user: UserProfile;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentTab,
  onSelectTab,
  onLogout,
}) => {
  const { logoSrc, isCustom } = useAppLogo();
  const headerBanner = isCustom ? logoSrc : '/tribbusvibe_transparent.png';

  return (
    <header
      className="navbar sticky top-0 z-100 h-[65px] px-4 sm:px-10 flex items-center justify-between"
      style={{
        backgroundColor: 'var(--cinza-card)',
        borderBottom: '3px solid transparent',
        borderImage: 'var(--gradient-supremo) 1',
      }}
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Lado Esquerdo: Nossa Logo Definitiva */}
        <div className="nav-logo-container flex items-center shrink-0 h-[45px] max-h-[45px]">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 text-left group cursor-pointer focus:outline-hidden bg-transparent border-none p-0 h-[45px]"
            title="Tribbu'sVibe - Conectando pessoas de verdade"
          >
            <img
              src="/logo.png"
              alt="Tribbu'sVibe Logo"
              className="nav-logo-img select-none"
              style={{
                height: '42px',
                maxHeight: '42px',
                width: 'auto',
                maxWidth: '220px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.25))',
              }}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.src = '/logo.png';
              }}
            />
          </button>
        </div>

        {/* Lado Direito: Links de Navegação + O Botão Supremo de Criar Tribu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <nav className="nav-links flex items-center gap-4 sm:gap-5">
            <button
              onClick={() => onSelectTab('home')}
              style={{
                textDecoration: 'none',
                color: currentTab === 'home' ? 'var(--pink-magenta)' : 'var(--texto-suave)',
                fontWeight: 600,
                fontSize: '0.95rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
                padding: 0,
              }}
              className="hover:text-[var(--pink-magenta)]"
            >
              Feed
            </button>

            <button
              onClick={() => onSelectTab('communities')}
              style={{
                textDecoration: 'none',
                color: currentTab === 'communities' ? 'var(--pink-magenta)' : 'var(--texto-suave)',
                fontWeight: 600,
                fontSize: '0.95rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
                padding: 0,
              }}
              className="hover:text-[var(--pink-magenta)]"
            >
              Tribos
            </button>

            <button
              onClick={() => onSelectTab('messages')}
              style={{
                textDecoration: 'none',
                color: currentTab === 'messages' ? 'var(--ciano-neon)' : 'var(--texto-suave)',
                fontWeight: 600,
                fontSize: '0.95rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
                padding: 0,
              }}
              className="hover:text-[var(--ciano-neon)]"
            >
              Messenger
            </button>

            <button
              onClick={() => onSelectTab('scraps')}
              style={{
                textDecoration: 'none',
                color: currentTab === 'scraps' || currentTab === 'testimonials' || currentTab === 'photos' ? 'var(--pink-magenta)' : 'var(--texto-suave)',
                fontWeight: 600,
                fontSize: '0.95rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
                padding: 0,
              }}
              className="hover:text-[var(--pink-magenta)]"
            >
              Meu Perfil
            </button>
          </nav>

          {/* 🚀 O BOTÃO SUPREMO DE CRIAR NOVA TRIBU */}
          <button
            onClick={() => {
              onSelectTab('communities');
              setTimeout(() => {
                const el = document.getElementById('formulario-criar');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  const inputNome = document.getElementById('nome-tribo');
                  if (inputNome) inputNome.focus();
                }
              }, 120);
            }}
            className="btn-criar-nav"
            title="Fundar uma nova Tribu"
          >
            <i className="fas fa-plus-circle"></i> Fundar Tribu
          </button>

          {/* Avatar e Ação de Desconectar */}
          <div className="flex items-center gap-2 pl-1 border-l border-white/10">
            <button
              onClick={() => onSelectTab('scraps')}
              className="flex items-center gap-2 cursor-pointer group"
              title={`Perfil de @${user.handle}`}
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-[var(--pink-magenta)] group-hover:scale-105 transition-transform"
                />
                <span className="absolute -top-1.5 -right-1 text-[11px] select-none" title="Fundador da Tribo">👑</span>
              </div>
            </button>

            <button
              onClick={async () => {
                const confirmar = window.confirm("Deseja desconectar da sua Tribo por hoje e descansar a mente? ☕");
                if (confirmar) {
                  console.log("Encerrando sessão com segurança...");
                  await realizarLogout();
                  onLogout();
                }
              }}
              title="Deseja desconectar da sua Tribo por hoje e descansar a mente? ☕"
              className="p-1.5 text-gray-400 hover:text-[var(--pink-magenta)] rounded-full transition-all cursor-pointer flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
