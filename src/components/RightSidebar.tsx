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
  // Renderiza amigos e tribos reais
  const displayFriends = friends.slice(0, 6);
  const displayCommunities = communities.filter((c) => c.joined).slice(0, 4);

  return (
    <aside className="coluna-direita-vibe">
      {/* 👥 Top Amigos Reais */}
      <div className="box-conexoes amigos-box">
        <div className="box-header">
          <h3>Meus Amigos ({friends.length})</h3>
          <a
            href="#amigos"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('scraps');
            }}
            className="ver-mais"
          >
            ver todos
          </a>
        </div>

        <div className="grade-conexoes">
          {displayFriends.length > 0 ? (
            displayFriends.map((amigo) => (
              <div
                key={amigo.id}
                className="conexao-card"
                onClick={() => {
                  if (onSelectFriend) onSelectFriend(amigo);
                }}
                title={amigo.name}
              >
                <div className="avatar-placeholder">{amigo.avatar || '👤'}</div>
                <span className="conexao-nome">{amigo.name}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 col-span-3 text-center py-4">Nenhum amigo ainda.</p>
          )}
        </div>
      </div>

      {/* 🪐 Minhas Tribbu's */}
      <div className="box-conexoes comus-box">
        <div className="box-header">
          <h3>Minhas Tribbu's ({communities.filter((c) => c.joined).length})</h3>
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
          {displayCommunities.length > 0 ? (
            displayCommunities.map((comu) => (
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
                title={comu.name}
              >
                <span className="comu-icone">{comu.avatar || '🪐'}</span>
                <span className="comu-nome">{comu.name}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 text-center py-4">Você ainda não participa de nenhuma Tribbu.</p>
          )}
        </div>
      </div>
    </aside>
  );
};
