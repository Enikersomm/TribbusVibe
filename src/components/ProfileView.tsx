import React, { useState, useEffect } from 'react';
import { UserProfile, Scrap, Testimonial, PhotoItem, Community } from '../types';
import { 
  initialProfile, 
  initialScraps, 
  initialTestimonials, 
  topFriends, 
  initialCommunities, 
  initialPhotos 
} from '../data/mockData';
import { Header } from './Header';
import { LeftSidebar } from './LeftSidebar';
import { CenterContent } from './CenterContent';
import { RightSidebar } from './RightSidebar';
import { HomeView } from './HomeView';
import { CommunitiesExplorerView } from './CommunitiesExplorerView';
import { SettingsView } from './SettingsView';
import { MessagesView } from './MessagesView';
import { CyberDarkProfileView } from './CyberDarkProfileView';
import { CommunityDetailView } from './CommunityDetailView';
import { VoteModal } from './VoteModal';
import { ArrowLeft, Sparkles, Check, Moon, Sun } from 'lucide-react';
import { cadastrarUsuario } from '../services/tribbusFirebase';
import { escutarScrapsDoPerfil, enviarScrapMural } from '../services/firebase-scraps';
import { escutarTribosDoBanco, criarTriboNoBanco } from '../services/firebase-tribos.js';

interface ProfileViewProps {
  customUserName?: string;
  initialTab?: string;
  onBackToLogin: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  customUserName,
  initialTab = 'home',
  onBackToLogin,
}) => {
  // Estado do Perfil
  const [user, setUser] = useState<UserProfile>(() => {
    if (customUserName) {
      return {
        ...initialProfile,
        name: customUserName,
        handle: customUserName.toLowerCase().replace(/\s+/g, '_'),
      };
    }
    return initialProfile;
  });

  // Aba Ativa (Pode iniciar em home ou communities conforme selecionado)
  const [currentTab, setCurrentTab] = useState<string>(initialTab);

  // Listas Dinâmicas
  const [scraps, setScraps] = useState<Scrap[]>(initialScraps);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [photos] = useState<PhotoItem[]>(initialPhotos);
  const [communities, setCommunities] = useState<Community[]>(initialCommunities);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);

  // Modal de Voto
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  // Tema do Perfil: Cyber Dark Oficial (Tribbu'sVibe) ou Rosa Retrô Clássico
  const [profileTheme, setProfileTheme] = useState<'cyberDark' | 'retroPink'>('cyberDark');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCommunity = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setCurrentTab('community-detail');
  };

  // 📡 Escuta as Comunidades/Tribos em tempo real do Firestore
  useEffect(() => {
    const unsubTribos = escutarTribosDoBanco((tribosBanco: any[]) => {
      if (tribosBanco && tribosBanco.length > 0) {
        setCommunities((prev) => {
          const mapa = new Map<string, Community>();
          prev.forEach((c) => mapa.set(c.id, c));
          tribosBanco.forEach((b: any) => {
            const existente = mapa.get(b.id);
            mapa.set(b.id, {
              id: b.id,
              name: b.name || b.nome,
              description: b.description || b.descricao,
              avatar: b.avatar || b.emblema || '🪐',
              category: b.category || b.categoria || 'Geral',
              memberCount: String(b.memberCount || b.membros_count || 1),
              joined: existente ? existente.joined : (b.membros ? b.membros.includes(user.id) : false),
            });
          });
          return Array.from(mapa.values());
        });
      }
    });

    return () => {
      if (typeof unsubTribos === 'function') unsubTribos();
    };
  }, [user.id]);

  // 📥 Escuta os Scraps em tempo real do Firestore para este perfil
  useEffect(() => {
    const perfilUid = user.id || 'fundador-tribbus-01';
    const unsubscribeScraps = escutarScrapsDoPerfil(perfilUid, (scrapsBanco: any[]) => {
      if (scrapsBanco && scrapsBanco.length > 0) {
        const scrapsMapeados: Scrap[] = scrapsBanco.map((s) => ({
          id: s.id,
          authorName: s.remetente_nome ? s.remetente_nome.replace('@', '') : 'Membro da Tribo',
          authorHandle: s.remetente_nome ? s.remetente_nome.replace('@', '') : 'amigo',
          authorAvatar: '🤠',
          content: s.conteudo_texto || '',
          timestamp: s.data_criacao ? 'Recentemente' : 'Agora mesmo',
          badge: '🪐 MURAL RETRÔ',
          likes: 0,
        }));
        setScraps(scrapsMapeados);
      }
    });

    return () => {
      unsubscribeScraps();
    };
  }, [user.id]);

  // Handlers
  const handleUpdateVibe = (newVibe: string) => {
    setUser((prev) => ({ ...prev, currentVibe: newVibe }));
    showToast('✨ Vibe atualizada no seu perfil!');
  };

  const handleSaveProfileSettings = async (updated: Partial<UserProfile>) => {
    setUser((prev) => ({
      ...prev,
      ...updated,
      vibeMeters: {
        ...prev.vibeMeters,
        ...(updated.vibeMeters || {}),
      },
    }));

    showToast('✨ Configurações da sua vibe salvas com sucesso!');

    try {
      await cadastrarUsuario({
        id: user.id || 'fundador-tribbus-01',
        nome: updated.name || user.name,
        email: `${(updated.name || user.name).toLowerCase().replace(/\s+/g, '')}@tribbusvibe.com`,
        status_vibe: updated.currentVibe || user.currentVibe,
        bio: updated.bio || user.bio,
        avatar_url: updated.avatar || user.avatar,
        medidor_confiavel: updated.vibeMeters?.trustworthy ?? user.vibeMeters.trustworthy,
        medidor_legal: updated.vibeMeters?.cool ?? user.vibeMeters.cool,
        medidor_vibe: updated.vibeMeters?.sexy ?? user.vibeMeters.sexy,
      });
    } catch (err) {
      console.warn('[TribbusVibe] Erro ao sincronizar com Firestore:', err);
    }
  };

  const handleAddScrap = async (content: string, badge?: string) => {
    const perfilUid = user.id || 'fundador-tribbus-01';
    const newScrap: Scrap = {
      id: `scrap_${Date.now()}`,
      authorName: user.name,
      authorHandle: user.handle,
      authorAvatar: user.avatar,
      content,
      timestamp: 'Agora mesmo',
      badge: badge || '💌 RECADO NOVO',
      likes: 0,
    };
    setScraps((prev) => [newScrap, ...prev]);
    setUser((prev) => ({
      ...prev,
      stats: { ...prev.stats, scraps: prev.stats.scraps + 1 },
    }));
    showToast('💌 Scrap publicado no mural com sucesso!');

    try {
      await enviarScrapMural(perfilUid, `@${user.handle}`, perfilUid, content);
    } catch (err) {
      console.warn('Erro ao persistir scrap:', err);
    }
  };

  const handleDeleteScrap = (id: string) => {
    setScraps(scraps.filter((s) => s.id !== id));
    setUser((prev) => ({
      ...prev,
      stats: { ...prev.stats, scraps: Math.max(0, prev.stats.scraps - 1) },
    }));
    showToast('Scrap removido do mural.');
  };

  const handleLikeScrap = (id: string) => {
    setScraps(
      scraps.map((s) => (s.id === id ? { ...s, likes: s.likes + 1 } : s))
    );
  };

  const handleAddTestimonial = (content: string) => {
    const newTest: Testimonial = {
      id: `test_${Date.now()}`,
      authorName: 'Amigo(a) Secreto(a)',
      authorHandle: 'amigovibe',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      content,
      date: 'Hoje',
      status: 'accepted',
    };
    setTestimonials([newTest, ...testimonials]);
    setUser((prev) => ({
      ...prev,
      stats: { ...prev.stats, testimonials: prev.stats.testimonials + 1 },
    }));
    showToast('⭐ Depoimento publicado com carinho!');
  };

  const handleToggleCommunity = (id: string) => {
    setCommunities(
      communities.map((c) =>
        c.id === id ? { ...c, joined: !c.joined } : c
      )
    );
    showToast('Status de comunidade atualizado!');
  };

  const handleCreateCommunity = async (newCom: { name: string; description: string; avatar: string }) => {
    const newId = `comm_${Date.now()}`;
    const newCommunity: Community = {
      id: newId,
      name: newCom.name,
      description: newCom.description,
      avatar: newCom.avatar,
      category: 'Criada pela Tribo',
      memberCount: '1',
      joined: true,
    };
    setCommunities([newCommunity, ...communities]);
    showToast(`🎉 Tribo "${newCom.name}" criada com sucesso!`);

    try {
      await criarTriboNoBanco({
        id: newId,
        nome: newCom.name,
        descricao: newCom.description,
        icone_emoji: newCom.avatar,
        criador_id: user.id || 'fundador-tribbus-01',
        categoria: 'Criada pela Tribo'
      });
    } catch (err) {
      console.warn('Erro ao salvar tribo no Firestore:', err);
    }
  };

  const handleVote = (type: 'trustworthy' | 'cool' | 'sexy') => {
    setUser((prev) => ({
      ...prev,
      vibeMeters: {
        ...prev.vibeMeters,
        [type]: Math.min(100, prev.vibeMeters[type] + 1),
      },
    }));
    showToast('🎉 Seu voto foi contabilizado!');
  };

  return (
    <div className={`min-h-screen ${profileTheme === 'cyberDark' ? 'bg-[#0B0911] text-white' : 'bg-[#FFF0F5] text-[#4A4A4A]'} flex flex-col font-sans transition-colors duration-300`}>
      
      {/* Barra de Troca Rápida de Telas (Demonstração para Sócio & Equipe) */}
      <div className="bg-[#FF1493] text-white py-1.5 px-4 text-xs font-bold flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
          <span>Tribbu&apos;sVibe — Meu Perfil</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Alternador de Tema do Perfil */}
          <button
            onClick={() => setProfileTheme((prev) => (prev === 'cyberDark' ? 'retroPink' : 'cyberDark'))}
            className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 hover:bg-white text-white hover:text-[#FF1493] rounded-full transition-all cursor-pointer font-bold"
            title="Alternar entre o Tema Cyber Dark Oficial e o Tema Rosa 3 Colunas"
          >
            {profileTheme === 'cyberDark' ? (
              <>
                <Moon className="w-3 h-3 text-[#00BFFF]" />
                <span>Modo: Cyber Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3 h-3 text-yellow-300" />
                <span>Modo: Rosa Retrô</span>
              </>
            )}
          </button>

          <button
            onClick={onBackToLogin}
            className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 hover:bg-white text-white hover:text-[#FF1493] rounded-full transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Voltar para Login</span>
          </button>
        </div>
      </div>

      {/* Header Principal da Rede */}
      <Header
        user={user}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onLogout={onBackToLogin}
      />

      {/* Alternância entre Feed, Tribos, Página da Tribo, Configurações e o Perfil */}
      {currentTab === 'home' ? (
        <HomeView
          user={user}
          onNavigateToProfile={() => setCurrentTab('scraps')}
          onNavigateToCommunities={() => setCurrentTab('communities')}
          onOpenCommunity={handleOpenCommunity}
        />
      ) : currentTab === 'communities' ? (
        <CommunitiesExplorerView
          communities={communities}
          onToggleCommunity={handleToggleCommunity}
          onCreateCommunity={handleCreateCommunity}
          onOpenCommunity={handleOpenCommunity}
          onNavigateToFeed={() => setCurrentTab('home')}
          onNavigateToProfile={() => setCurrentTab('scraps')}
        />
      ) : currentTab === 'community-detail' ? (
        <CommunityDetailView
          community={
            communities.find((c) => c.id === selectedCommunityId) ||
            communities[0] || {
              id: 'tribo_ps2_oficial',
              name: 'Tocadores de PS2',
              category: 'Games Nostalgia',
              memberCount: '2.1k',
              avatar: '🎮',
              joined: false,
              description: 'Comunidade oficial para debater ideias e compartilhar postagens!',
            }
          }
          user={user}
          onBack={() => setCurrentTab('communities')}
          onToggleJoin={handleToggleCommunity}
        />
      ) : currentTab === 'settings' ? (
        <SettingsView
          user={user}
          onSaveProfile={handleSaveProfileSettings}
          onNavigateToTab={setCurrentTab}
        />
      ) : currentTab === 'messages' ? (
        <MessagesView
          user={user}
          onNavigateToTab={setCurrentTab}
        />
      ) : profileTheme === 'cyberDark' ? (
        /* Visual Oficial Cyber Dark solicitado */
        <CyberDarkProfileView
          user={user}
          scraps={scraps}
          onAddScrap={handleAddScrap}
          onDeleteScrap={handleDeleteScrap}
          onLikeScrap={handleLikeScrap}
          onOpenVoteModal={() => setIsVoteModalOpen(true)}
        />
      ) : (
        /* Container Principal em 3 Colunas Clássicas do Perfil */
        <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-5">
          {/* Coluna Esquerda (Avatar, Bio, Player) */}
          <LeftSidebar
            user={user}
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onUpdateVibe={handleUpdateVibe}
          />

          {/* Coluna Central (Medidores, Biscoito da Sorte, Abas) */}
          <CenterContent
            user={user}
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            scraps={scraps}
            onAddScrap={handleAddScrap}
            onDeleteScrap={handleDeleteScrap}
            onLikeScrap={handleLikeScrap}
            testimonials={testimonials}
            onAddTestimonial={handleAddTestimonial}
            photos={photos}
            communities={communities}
            onToggleCommunity={handleToggleCommunity}
            onOpenVoteModal={() => setIsVoteModalOpen(true)}
            onOpenCommunity={handleOpenCommunity}
          />

          {/* Coluna Direita (Top 6 Amigos, Comunidades) */}
          <RightSidebar
            friends={topFriends}
            communities={communities}
            onSelectTab={setCurrentTab}
            onOpenCommunity={handleOpenCommunity}
            onSelectFriend={(friend) => {
              showToast(`Visitando perfil de @${friend.handle}!`);
            }}
          />
        </main>
      )}

      {/* Modal de Voto nos Medidores */}
      <VoteModal
        userName={user.name}
        isOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        onVote={handleVote}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#4A4A4A] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-[#FF69B4]/40 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-[#00BFFF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Rodapé Nostálgico */}
      <footer className="mt-auto py-6 text-center text-xs text-gray-500 border-t border-[#FF69B4]/15 bg-white/50">
        &copy; 2026 TribbusVibe Inc. — Conectando pessoas de verdade de um jeito seguro e tranquilo.
      </footer>

    </div>
  );
};
