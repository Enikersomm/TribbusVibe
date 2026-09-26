import React, { useState } from 'react';
import { Camera, Sparkles, Edit3, Check } from 'lucide-react';
import { UserProfile } from '../types';

interface LeftSidebarProps {
  user: UserProfile;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onUpdateVibe: (newVibe: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  user,
  currentTab,
  onSelectTab,
  onUpdateVibe,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isEditingVibe, setIsEditingVibe] = useState(false);
  const [vibeInput, setVibeInput] = useState(user.currentVibe);

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSaveVibe = () => {
    if (vibeInput.trim()) {
      onUpdateVibe(vibeInput.trim());
    }
    setIsEditingVibe(false);
  };

  return (
    <aside className="coluna-esquerda-vibe">
      {/* 👤 Card do Usuário (Foto, Nome, Bio & Vibe) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#FF69B4]/20 flex flex-col items-center text-center">
        {/* Avatar com status online */}
        <div className="relative mb-3 group">
          <div className="w-32 h-32 rounded-2xl overflow-hidden border-3 border-[#FFF0F5] shadow-sm">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <span
            className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-xs"
            title="Online no TribbusVibe"
          />
          <button
            className="absolute top-1.5 right-1.5 p-1 bg-black/40 hover:bg-[#FF1493] text-white rounded-full transition-colors cursor-pointer"
            title="Alterar foto de perfil"
            onClick={() => {
              const newUrl = prompt('Insira o link da nova imagem de perfil:', user.avatar);
              if (newUrl) {
                user.avatar = newUrl;
                onUpdateVibe(user.currentVibe);
              }
            }}
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>

        {/* Nome e @handle */}
        <h2 className="text-lg font-black text-[#4A4A4A] tracking-tight">
          {user.name}
        </h2>
        <p className="text-xs font-bold text-[#FF1493] -mt-0.5 mb-2">
          @{user.handle} • <span className="text-gray-500 font-normal">{user.pronouns}</span>
        </p>

        {/* Vibe de Hoje (Editável) */}
        <div className="w-full bg-[#FFF0F5] rounded-xl p-2.5 border border-[#FF69B4]/20 text-xs text-left mb-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#FF1493] uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FF1493]" /> Vibe de Hoje:
            </span>
            {!isEditingVibe ? (
              <button
                onClick={() => setIsEditingVibe(true)}
                className="hover:text-[#00BFFF] cursor-pointer"
                title="Editar Vibe"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={handleSaveVibe}
                className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                title="Salvar Vibe"
              >
                <Check className="w-3 h-3" />
              </button>
            )}
          </div>

          {isEditingVibe ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="text"
                value={vibeInput}
                onChange={(e) => setVibeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveVibe()}
                className="w-full bg-white px-2 py-1 text-xs rounded-md border border-[#FF69B4] text-[#4A4A4A] focus:outline-hidden"
                autoFocus
              />
            </div>
          ) : (
            <p className="text-gray-700 italic font-medium leading-tight">
              "{user.currentVibe}"
            </p>
          )}
        </div>
      </div>

      {/* 📱 Menu de Navegação Clássico */}
      <nav className="menu-perfil">
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('home');
          }}
          className={`menu-item ${currentTab === 'home' ? 'active' : ''}`}
        >
          🪐 Início (Feed & Stories)
        </a>
        <a
          href="#perfil"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('scraps');
          }}
          className={`menu-item ${currentTab === 'scraps' ? 'active' : ''}`}
        >
          👤 Perfil
        </a>
        <a
          href="#scraps"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('scraps');
          }}
          className={`menu-item ${currentTab === 'scraps' ? 'active' : ''}`}
        >
          📥 Scraps (Recados)
        </a>
        <a
          href="#depoimentos"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('testimonials');
          }}
          className={`menu-item ${currentTab === 'testimonials' ? 'active' : ''}`}
        >
          ✍️ Depoimentos
        </a>
        <a
          href="#mensagens"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('messages');
          }}
          className={`menu-item ${currentTab === 'messages' ? 'active' : ''}`}
        >
          💬 Mensagens Privadas
        </a>
        <a
          href="#tribos"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('communities');
          }}
          className={`menu-item ${currentTab === 'communities' ? 'active' : ''}`}
        >
          🧭 Explorar Tribos
        </a>
        <a
          href="#albuns"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('photos');
          }}
          className={`menu-item ${currentTab === 'photos' ? 'active' : ''}`}
        >
          📸 Meus Álbuns
        </a>
        <a
          href="#videos"
          onClick={(e) => {
            e.preventDefault();
            alert('Em breve: player nostálgico de clipes do YouTube anos 2000!');
          }}
          className="menu-item"
        >
          🎥 Vídeos
        </a>
        <a
          href="#config"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('settings');
          }}
          className={`menu-item ${currentTab === 'settings' ? 'active' : ''}`}
        >
          ⚙️ Configurações
        </a>
      </nav>

      {/* 🎵 O Lendário Tocador de Música do Perfil */}
      <div className="player-musica-vibe">
        <div className="player-header">
          <span className="player-status">
            {isPlaying ? 'Playing Now 🎧' : 'Paused ⏸️'}
          </span>
          <button
            onClick={toggleMusic}
            className="text-[10px] text-[#00BFFF] hover:underline cursor-pointer uppercase font-bold"
          >
            {isPlaying ? 'Pausar' : 'Play'}
          </button>
        </div>
        <div className="player-body">
          <div
            onClick={toggleMusic}
            className={`disco-animado ${isPlaying ? 'girando' : ''}`}
            title="Clique para dar play ou pausar"
          >
            💿
          </div>
          <div className="musica-info">
            <span className="musica-titulo" title="A Thousand Miles">
              A Thousand Miles
            </span>
            <span className="musica-artista">Vanessa Carlton</span>
          </div>
        </div>
        {/* Barra de progresso visual */}
        <div className="player-progress-bar">
          <div
            className="player-progress-current"
            style={{ width: isPlaying ? '65%' : '45%' }}
          ></div>
        </div>
      </div>
    </aside>
  );
};
