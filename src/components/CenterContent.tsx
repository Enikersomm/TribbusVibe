import React, { useState } from 'react';
import { UserProfile, Scrap, Testimonial, PhotoItem, Community } from '../types';
import { FORTUNES } from '../data/mockData';
import { 
  Send, 
  Heart, 
  Trash2, 
  PlusCircle, 
  Award,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface CenterContentProps {
  user: UserProfile;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  scraps: Scrap[];
  onAddScrap: (content: string, badge?: string) => void;
  onDeleteScrap: (id: string) => void;
  onLikeScrap: (id: string) => void;
  testimonials: Testimonial[];
  onAddTestimonial: (content: string) => void;
  photos: PhotoItem[];
  communities: Community[];
  onToggleCommunity: (id: string) => void;
  onOpenVoteModal: () => void;
  onOpenCommunity?: (id: string) => void;
}

export const CenterContent: React.FC<CenterContentProps> = ({
  user,
  currentTab,
  onSelectTab,
  scraps,
  onAddScrap,
  onDeleteScrap,
  onLikeScrap,
  testimonials,
  onAddTestimonial,
  photos,
  communities,
  onToggleCommunity,
  onOpenVoteModal,
  onOpenCommunity,
}) => {
  // Sorte do Dia Interativa
  const [fortuneIndex, setFortuneIndex] = useState(0);
  const [isCookieCracking, setIsCookieCracking] = useState(false);

  // Formulário de Scrap
  const [newScrapText, setNewScrapText] = useState('');
  const [scrapBadge, setScrapBadge] = useState<string>('🌸 RECADO FOFO');

  // Formulário de Depoimento
  const [newTestimonialText, setNewTestimonialText] = useState('');
  const [testimonialSentMessage, setTestimonialSentMessage] = useState(false);

  // Tocador de Música Integrado
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);

  const handleNextFortune = () => {
    setIsCookieCracking(true);
    setTimeout(() => {
      setFortuneIndex((prev) => (prev + 1) % FORTUNES.length);
      setIsCookieCracking(false);
    }, 200);
  };

  const handleScrapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScrapText.trim()) return;
    onAddScrap(newScrapText.trim(), scrapBadge);
    setNewScrapText('');
  };

  const handleTestimonialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonialText.trim()) return;
    onAddTestimonial(newTestimonialText.trim());
    setNewTestimonialText('');
    setTestimonialSentMessage(true);
    setTimeout(() => setTestimonialSentMessage(false), 4000);
  };

  return (
    <div className="flex-1 flex flex-col gap-5 min-w-0">
      
      {/* ═══════════════════════════════════════════════════════════════
          BLOCO CENTRAL DO PERFIL (ESTILO LARA CROFT / ANTIALGORITMO)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bloco-central-perfil">

        {/* 1. CABEÇALHO DO PERFIL & SORTE DO DIA */}
        <header className="perfil-header">
          <div className="user-info flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="user-name">
                {user.name} <span className="user-status">🪐 em órbita...</span>
              </h1>
              <p className="user-slogan">
                "Colecionadora de câmeras digitais antigas, fã de Avril Lavigne e Charli xcx."
              </p>
            </div>

            {/* Botão de Avaliar a Vibe */}
            <button
              onClick={onOpenVoteModal}
              className="self-start sm:self-center px-3.5 py-1.5 bg-[#FFF0F5] hover:bg-[#FF1493] text-[#FF1493] hover:text-white border border-[#FF69B4]/30 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Votar na Vibe da Lara"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Avaliar Vibe</span>
            </button>
          </div>
          
          {/* Caixa da Sorte do Dia */}
          <div className="sorte-do-dia-box flex items-start justify-between gap-3">
            <div className="flex-1">
              <span className="sorte-titulo">🍀 Sorte do Dia:</span>
              <p className={`sorte-texto transition-opacity duration-200 ${isCookieCracking ? 'opacity-30' : 'opacity-100'}`}>
                {fortuneIndex === 0
                  ? 'Descanse a mente: nenhum algoritmo vale a sua paz de espírito.'
                  : FORTUNES[fortuneIndex].replace(/^🥠\s*"?|"?$/g, '')}
              </p>
            </div>
            <button
              onClick={handleNextFortune}
              className="p-1.5 text-[#FF69B4] hover:text-[#FF1493] rounded-full hover:bg-white/80 transition-colors cursor-pointer shrink-0"
              title="Tirar outro biscoito da sorte"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCookieCracking ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* 🎨 CONTAINER INTEGRADO PARA O PERFIL DO TRIBBUSVIBE (COMPONENTES COM DEGRADÊ) */}
        <div className="container-demonstracao">
          {/* Lado Esquerdo: Os Novos Medidores */}
          <section className="secao-medidores">
            <div className="flex items-center justify-between">
              <h3>Minha Reputação</h3>
              <button
                onClick={onOpenVoteModal}
                className="text-[11px] font-bold text-[#FF1493] hover:underline flex items-center gap-1 cursor-pointer bg-[#FFF0F5] px-2.5 py-1 rounded-full border border-[#FF69B4]/20 transition-all hover:bg-[#FF1493] hover:text-white"
                title="Avaliar esta vibe"
              >
                <span>Avaliar vibe ✨</span>
              </button>
            </div>

            <div className="medidor-linha">
              <div className="medidor-info">
                <span>🧊 Confiável</span> <span>85%</span>
              </div>
              <div className="barra-base">
                <div className="barra-preenchimento" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div className="medidor-linha">
              <div className="medidor-info">
                <span>❤️ Legal</span> <span>95%</span>
              </div>
              <div className="barra-base">
                <div className="barra-preenchimento" style={{ width: '95%' }}></div>
              </div>
            </div>

            <div className="medidor-linha">
              <div className="medidor-info">
                <span>🌟 Vibe</span> <span>100%</span>
              </div>
              <div className="barra-base">
                <div className="barra-preenchimento" style={{ width: '100%' }}></div>
              </div>
            </div>
          </section>

          {/* Lado Direito: O Player Neon */}
          <section className="secao-player">
            <div className="player-topo">
              <span>{isPlayingMusic ? 'Tocando Agora 🎧' : 'Pausado ⏸️'}</span>
              <button
                onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                className="text-[10px] text-[#00BFFF] hover:underline cursor-pointer uppercase font-bold"
              >
                {isPlayingMusic ? 'Pausar' : 'Play'}
              </button>
            </div>
            <div className="player-conteudo">
              <div
                onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                className={`disco-vinil ${!isPlayingMusic ? 'pausado' : ''}`}
                title="Clique para pausar ou tocar"
              >
                💿
              </div>
              <div className="musica-detalhes">
                <span className="musica-nome" title="A Thousand Miles">
                  A Thousand Miles
                </span>
                <span className="musica-artista">Vanessa Carlton</span>
              </div>
            </div>
            <div className="player-progresso-base">
              <div
                className="player-progresso-atual"
                style={{ width: isPlayingMusic ? '60%' : '35%' }}
              ></div>
            </div>
          </section>
        </div>

        {/* 3. QUEM SOU EU (BIO DETALHADA) */}
        <section className="bio-section">
          <h3>Quem sou eu</h3>
          <div className="bio-conteudo">
            <p>
              Aqui ninguém precisa performar produtividade. Só estou tentando viver na minha própria sintonia, postando fotos com flash estourado e criando comunidades que fazem sentido.
            </p>
            <p>
              <strong>Interesses:</strong> Fotografia analógica, CSS antigo, CSS moderno, jogos de PS2 e passar horas lendo scraps dos outros.
            </p>
          </div>
        </section>

        {/* 4. MURAL DE SCRAPS (ÚLTIMOS RECADOS) */}
        <section className="scraps-section">
          <div className="scraps-header">
            <h3>Mural de Scraps ({scraps.length})</h3>
            <button
              onClick={() => onSelectTab('scraps')}
              className="ver-todos-link text-xs font-bold text-[#00BFFF] hover:underline cursor-pointer"
            >
              Ver todos ({scraps.length})
            </button>
          </div>
          
          <div className="scraps-list">
            {/* Scrap 1 */}
            <div className="scrap-card">
              <div className="scrap-autor">
                <strong>@thiago_y2k</strong> <span className="scrap-data">Hoje, 14:20</span>
              </div>
              <p className="scrap-texto">
                Passando para deixar um scrap na sua vibe! Me aceita na comu de fotografia depois? Valeu!! ✌️
              </p>
            </div>

            {/* Scrap 2 */}
            <div className="scrap-card">
              <div className="scrap-autor">
                <strong>@marina_retro</strong> <span className="scrap-data">Ontem, 18:45</span>
              </div>
              <p className="scrap-texto">
                Laraaa! Achei aquela câmera digital que você queria na feira do rolo! Depois me chama no chat.
              </p>
            </div>

            {/* Scraps dinâmicos adicionais criados pelo usuário */}
            {scraps
              .filter(
                (s) =>
                  !s.content.includes('Passando para deixar um scrap na sua vibe') &&
                  !s.content.includes('Achei aquela câmera digital')
              )
              .slice(0, 3)
              .map((s) => (
                <div key={s.id} className="scrap-card">
                  <div className="scrap-autor">
                    <strong>@{s.authorHandle}</strong>{' '}
                    <span className="scrap-data">{s.timestamp}</span>
                  </div>
                  <p className="scrap-texto">{s.content}</p>
                </div>
              ))}
          </div>
        </section>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ABAS ADICIONAIS DE NAVEGAÇÃO COMPLETA (MURAL, DEPOIMENTOS, FOTOS, COMUNIDADES)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 border-b border-[#FF69B4]/30 pb-1 overflow-x-auto mt-1">
        <button
          onClick={() => onSelectTab('scraps')}
          className={`px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            currentTab === 'scraps'
              ? 'bg-white text-[#FF1493] border-2 border-b-0 border-[#FF69B4]/25 shadow-xs'
              : 'text-gray-500 hover:text-[#FF1493] hover:bg-white/50'
          }`}
        >
          💌 Deixar Scrap ({scraps.length})
        </button>

        <button
          onClick={() => onSelectTab('testimonials')}
          className={`px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            currentTab === 'testimonials'
              ? 'bg-white text-[#FF1493] border-2 border-b-0 border-[#FF69B4]/25 shadow-xs'
              : 'text-gray-500 hover:text-[#FF1493] hover:bg-white/50'
          }`}
        >
          ⭐ Depoimentos ({testimonials.length})
        </button>

        <button
          onClick={() => onSelectTab('photos')}
          className={`px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            currentTab === 'photos'
              ? 'bg-white text-[#FF1493] border-2 border-b-0 border-[#FF69B4]/25 shadow-xs'
              : 'text-gray-500 hover:text-[#FF1493] hover:bg-white/50'
          }`}
        >
          📸 Fotos & Momentos ({photos.length})
        </button>

        <button
          onClick={() => onSelectTab('communities')}
          className={`px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            currentTab === 'communities'
              ? 'bg-white text-[#FF1493] border-2 border-b-0 border-[#FF69B4]/25 shadow-xs'
              : 'text-gray-500 hover:text-[#FF1493] hover:bg-white/50'
          }`}
        >
          🧭 Minhas Tribos ({communities.filter((c) => c.joined).length})
        </button>
      </div>

      {/* Seção de Enviar Scrap */}
      {currentTab === 'scraps' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#FF69B4]/20 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#FF1493] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Publicar um novo Scrap no mural de Lara</span>
          </h4>
          
          <form onSubmit={handleScrapSubmit} className="space-y-3">
            <textarea
              rows={3}
              value={newScrapText}
              onChange={(e) => setNewScrapText(e.target.value)}
              placeholder="Escreva seu recado nostálgico aqui... Ex: 'Passando só pra deixar um oi e avisar que tem vídeo novo!' ✨💿"
              className="w-full p-3 text-xs sm:text-sm bg-[#FFF0F5]/50 border border-[#FF69B4]/30 rounded-xl text-[#4A4A4A] placeholder:text-gray-400 focus:outline-hidden focus:border-[#FF1493] focus:ring-2 focus:ring-[#FF1493]/20 transition-all resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-500">Selo:</span>
                {['🌸 RECADO FOFO', '💿 GLITTER Y2K', '🤫 RECADO SECRETO'].map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => setScrapBadge(badge)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition-all ${
                      scrapBadge === badge
                        ? 'bg-[#FF1493] text-white'
                        : 'bg-[#FFF0F5] text-gray-600 hover:bg-[#FF69B4]/20'
                    }`}
                  >
                    {badge}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#FF1493] hover:bg-[#D1107A] text-white rounded-full text-xs font-bold transition-all shadow-md shadow-[#FF1493]/20 flex items-center gap-1.5 cursor-pointer hover:scale-102"
              >
                <Send className="w-3 h-3" />
                <span>Enviar Scrap</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Seção de Depoimentos */}
      {currentTab === 'testimonials' && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#FFF0F5] p-3.5 rounded-2xl border-2 border-dashed border-[#FF69B4]/40 flex items-center gap-3 text-xs text-[#FF1493] font-bold">
            <span className="text-xl">⚠️</span>
            <span>
              AVISO SAGRADO: Depoimentos de amizade sincera! No Orkut clássico, "só aceita se for bom!".
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#FF69B4]/20">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#FF1493] mb-2">
              Escrever depoimento para a Lara
            </h4>
            <form onSubmit={handleTestimonialSubmit} className="space-y-3">
              <textarea
                rows={3}
                value={newTestimonialText}
                onChange={(e) => setNewTestimonialText(e.target.value)}
                placeholder="Declare sua amizade... 'Conheço a Lara desde... te considero pacas!' 💖✨"
                className="w-full p-3 text-xs sm:text-sm bg-[#FFF0F5]/50 border border-[#FF69B4]/30 rounded-xl text-[#4A4A4A] placeholder:text-gray-400 focus:outline-hidden focus:border-[#FF1493] focus:ring-2 focus:ring-[#FF1493]/20 transition-all resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500 italic">
                  Será enviado para aprovação antes de aparecer no perfil
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF1493] hover:bg-[#D1107A] text-white rounded-full text-xs font-bold transition-all shadow-md shadow-[#FF1493]/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Enviar Depoimento</span>
                </button>
              </div>
            </form>
            {testimonialSentMessage && (
              <p className="text-xs text-green-600 font-bold mt-2">
                ✓ Depoimento enviado para moderação de Lara com sucesso!
              </p>
            )}
          </div>

          <div className="space-y-3">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl p-4 border border-[#FF69B4]/20 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img src={t.authorAvatar} alt={t.authorName} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <strong className="text-xs text-[#4A4A4A] block">{t.authorName}</strong>
                      <span className="text-[10px] text-gray-400">@{t.authorHandle}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">{t.date}</span>
                </div>
                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">{t.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de Fotos */}
      {currentTab === 'photos' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-4 border border-[#FF69B4]/20 flex items-center justify-between">
            <h4 className="text-xs font-black text-[#FF1493] uppercase tracking-wider">
              Álbuns de Fotos Cybershot
            </h4>
            <button
              onClick={() => {
                const title = prompt('Nome ou legenda da foto:');
                if (title) {
                  photos.unshift({
                    id: `p_${Date.now()}`,
                    title,
                    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
                    dateStamp: 'HOJE/2026',
                    likes: 1,
                    commentsCount: 0,
                  });
                  onSelectTab('photos');
                }
              }}
              className="px-3 py-1.5 bg-[#FF1493] text-white rounded-full text-xs font-bold cursor-pointer hover:bg-[#D1107A] transition-colors flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Adicionar Foto</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#FF69B4]/20 group hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-mono text-amber-400 font-bold tracking-wider shadow-xs">
                    {photo.dateStamp}
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <p className="text-xs sm:text-sm font-semibold text-[#4A4A4A] mb-2 line-clamp-2">
                    {photo.title}
                  </p>
                  <button
                    onClick={() => {
                      photo.likes += 1;
                      onSelectTab('photos');
                    }}
                    className="flex items-center gap-1 text-[#FF1493] font-bold text-xs cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-[#FF1493]" />
                    <span>{photo.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de Comunidades */}
      {currentTab === 'communities' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {communities.map((comm) => (
            <div
              key={comm.id}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-[#FF69B4]/20 hover:border-[#FF1493] flex items-center justify-between gap-3 transition-all cursor-pointer group"
              onClick={() => {
                if (onOpenCommunity) {
                  onOpenCommunity(comm.id);
                } else {
                  onToggleCommunity(comm.id);
                }
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] border-2 border-[#FF69B4]/30 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                  {comm.avatar}
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs sm:text-sm font-bold text-[#4A4A4A] group-hover:text-[#FF1493] transition-colors truncate">{comm.name}</h5>
                  <p className="text-[11px] text-gray-500">
                    {comm.category} • <strong className="text-[#FF1493]">{comm.memberCount}</strong> membros
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCommunity(comm.id);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  comm.joined
                    ? 'bg-[#FFF0F5] text-[#FF1493] hover:bg-red-50 hover:text-red-500 border border-[#FF69B4]/30'
                    : 'bg-[#FF1493] text-white hover:bg-[#D1107A]'
                }`}
              >
                {comm.joined ? 'Membro ✓' : 'Participar +'}
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
