import React, { useState, useEffect } from 'react';
import { LoginView } from './components/LoginView';
import { ProfileView } from './components/ProfileView';
import { NotFoundView } from './components/NotFoundView';
import { inicializarBancoSeVazio } from './services/tribbusFirebase';
import RotasTribbusVibe from './services/rotas-navegacao';
import { escutarEstadoAutenticacao, realizarLogout } from './services/firebase-auth-login';

export default function App() {
  const [currentView, setCurrentView] = useState<'profile' | 'login' | '404'>('login');
  const [initialProfileTab, setInitialProfileTab] = useState<string>('home');
  const [userName, setUserName] = useState<string>('Membro Vibe');

  useEffect(() => {
    // Inicializa automaticamente o Firestore com as 4 coleções e dados base
    inicializarBancoSeVazio().catch((err) => {
      console.warn('[TribbusVibe] Inicialização do banco:', err);
    });

    // Escuta as rotas globais do sistema TribbusVibe
    const cancelarRotas = RotasTribbusVibe.escutar((novaRota) => {
      if (novaRota === 'home') {
        setInitialProfileTab('home');
        setCurrentView('profile');
      } else if (novaRota === 'acesso') {
        setCurrentView('login');
      } else if (novaRota === 'tribos') {
        setInitialProfileTab('communities');
        setCurrentView('profile');
      } else if (novaRota === 'perfil') {
        setInitialProfileTab('scraps');
        setCurrentView('profile');
      } else if (novaRota === '404') {
        setCurrentView('404');
      }
    });

    // Escuta o estado do Firebase Auth em tempo real
    const cancelarAuth = escutarEstadoAutenticacao((usuario) => {
      if (usuario) {
        const nomeIdentificado = usuario.displayName || usuario.email?.split('@')[0] || 'Membro Vibe';
        setUserName(nomeIdentificado);
      }
    });

    return () => {
      cancelarRotas();
      cancelarAuth();
    };
  }, []);

  const handleLogin = (name?: string) => {
    if (name) {
      setUserName(name);
    }
    setInitialProfileTab('home');
    setCurrentView('profile');
  };

  const handleOpenTribos = () => {
    RotasTribbusVibe.irParaTribos();
  };

  const handleLogout = async () => {
    await realizarLogout();
    setCurrentView('login');
  };

  return (
    <div className="w-full min-h-screen bg-[#FFF0F5]">
      {currentView === 'login' ? (
        <LoginView
          onLogin={handleLogin}
          onOpen404={() => setCurrentView('404')}
          onOpenTribos={handleOpenTribos}
        />
      ) : currentView === 'profile' ? (
        <ProfileView
          customUserName={userName}
          initialTab={initialProfileTab}
          onBackToLogin={handleLogout}
        />
      ) : (
        <NotFoundView onBackToVibe={() => setCurrentView('login')} />
      )}
    </div>
  );
}
