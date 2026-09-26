import React from 'react';
import { Friend, Community } from '../types';

interface RightSidebarProps {
  friends: Friend[];
  communities: Community[];
  onSelectTab: (tab: string) => void;
  onSelectFriend?: (friend: Friend) => void;
  onOpenCommunity?: (communityId: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  friends,
  communities,
  onSelectTab,
  onSelectFriend,
  onOpenCommunity,
}) => {
  // Lista dos 6 amigos conforme o template do usuário (com emojis de avatar)
  const top6Friends = [
    { id: '1', nome: 'Thiago', icone: '🧑💻', handle: 'thiago_y2k' },
    { id: '2', nome: 'Marina', icone: '👩🎨', handle: 'marina_retro' },
    { id: '3', nome: 'Carol', icone: '🐱', handle: 'carol_pixel' },
    { id: '4', nome: 'Lucas', icone: '🛹', handle: 'lucas_sk8' },
    { id: '5', nome: 'Pedro', icone: '🎮', handle: 'pedro_cyber' },
    { id: '6', nome: 'Bia', icone: '🎧', handle: 'bia_indie' },
  ];

  // Minhas 4 Comus Favoritas conforme o template do usuário
  const top4Comus = [
    { id: 'c1', icone: '🥱', nome: 'Eu odeio acordar cedo' },
    { id: 'c2', icone: '📷', nome: 'Fotografia Analógica' },
    { id: 'c3', icone: '🎸', nome: 'Tocadores de PS2' },
    { id: 'c4', icone: '☕', nome: 'Café, Calma e Código' },
  ];

  return (
    <aside className="coluna-direita-vibe">
      {/* 👥 O Lendário Top 6 de Amigos */}
      <div className="box-conexoes amigos-box">
        <div className="box-header">
          <h3>Meus Amigos (6)</h3>
          <a
            href="#amigos"
            onClick={(e) => {
              e.preventDefault();
              alert('Lista completa dos 42 amigos do OrkuVibe!');
            }}
            className="ver-mais"
          >
            ver todos
          </a>
        </div>

        <div className="grade-conexoes">
          {top6Friends.map((amigo) => (
            <div
              key={amigo.id}
              className="conexao-card"
              onClick={() => {
                const found = friends.find((f) => f.name.toLowerCase().includes(amigo.nome.toLowerCase()));
                if (found && onSelectFriend) {
                  onSelectFriend(found);
                } else {
                  alert(`Visitando o perfil de ${amigo.nome} (@${amigo.handle})!`);
                }
              }}
              title={`${amigo.nome} (@${amigo.handle})`}
            >
              <div className="avatar-placeholder">{amigo.icone}</div>
              <span className="conexao-nome">{amigo.nome}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ☕ Minhas Tribos Favoritas */}
      <div className="box-conexoes comus-box">
        <div className="box-header">
          <h3>Minhas Tribos ({communities.filter((c) => c.joined).length})</h3>
          <a
            href="#tribos"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('communities');
            }}
            className="ver-mais"
          >
            explorar todas
          </a>
        </div>

        <div className="lista-comus">
          {top4Comus.map((comu) => (
            <div
              key={comu.id}
              className="comu-item-linha cursor-pointer hover:text-[#FF1493] transition-colors"
              onClick={() => {
                if (onOpenCommunity) {
                  onOpenCommunity(comu.id);
                } else {
                  onSelectTab('communities');
                }
              }}
              title={comu.nome}
            >
              <span className="comu-icone">{comu.icone}</span>
              <span className="comu-nome">{comu.nome}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
