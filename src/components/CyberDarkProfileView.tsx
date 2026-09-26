import React, { useState, useEffect } from 'react';
import { UserProfile, Scrap } from '../types';
import { Sparkles, Trash2, Heart, Send, UserPlus, X } from 'lucide-react';
import { escutarVitrineAmigos, adicionarAmigoNoTop, removerAmigoDoTop } from '../services/firebase-top-amigos';

interface CyberDarkProfileViewProps {
  user: UserProfile;
  scraps: Scrap[];
  onAddScrap: (content: string, badge?: string) => void;
  onDeleteScrap: (id: string) => void;
  onLikeScrap: (id: string) => void;
  onOpenVoteModal: () => void;
}

export const CyberDarkProfileView: React.FC<CyberDarkProfileViewProps> = ({
  user,
  scraps,
  onAddScrap,
  onDeleteScrap,
  onLikeScrap,
  onOpenVoteModal,
}) => {
  const [scrapText, setScrapText] = useState('');
  const [topAmigos, setTopAmigos] = useState<any[]>([]);

  // 🔄 Escuta em tempo real a vitrine de amigos favoritos
  useEffect(() => {
    const usuarioId = user.id || 'fundador-tribbus-01';
    const unsub = escutarVitrineAmigos(usuarioId, (lista: any[]) => {
      setTopAmigos(lista);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [user.id]);

  const handleAdicionarAmigo = async () => {
    const nome = prompt("Nome do amigo para favoritar na sua vitrine:");
    if (!nome || !nome.trim()) return;

    const avatar = prompt("URL da Foto/Avatar (ou Enter para avatar automático):");
    const avatarFinal = avatar && avatar.trim() 
      ? avatar.trim() 
      : `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 99999999)}?w=150&auto=format&fit=crop&q=80`;

    const usuarioId = user.id || 'fundador-tribbus-01';
    const amigoId = 'amigo-' + Date.now();
    await adicionarAmigoNoTop(usuarioId, amigoId, nome.trim(), avatarFinal);
  };

  const handleRemoverAmigo = async (docId: string, nome: string) => {
    if (confirm(`Remover ${nome} da sua vitrine de favoritos?`)) {
      await removerAmigoDoTop(docId);
    }
  };

  const handleSubmitScrap = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scrapText.trim()) return;
    onAddScrap(scrapText.trim(), '🪐 MURAL RETRÔ');
    setScrapText('');
  };

  return (
    <div className="w-full flex justify-center py-4 sm:py-8 bg-[#0B0911] text-white min-h-[calc(100vh-120px)] transition-colors">
      <div className="perfil-layout">
        
        {/* ESQUERDA: AVATAR E REPUTAÇÃO */}
        <aside className="card-vibe perfil-esquerda">
          <div className="avatar-g select-none relative group cursor-pointer" onClick={onOpenVoteModal} title="Clique para votar nos medidores!">
            <span>🤠</span>
            <span className="absolute -top-1 -right-1 text-sm bg-[#151221] px-1.5 py-0.5 rounded-full border border-[#00BFFF]" title="Fundador">👑</span>
          </div>

          <div className="text-center">
            <h2 id="perfil-nome-texto" className="text-xl font-bold tracking-tight text-white">{user.name}</h2>
            <p className="text-xs font-bold text-[#FF1493] mt-0.5">@{user.handle}</p>
          </div>
          
          <div className="termometros-container">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span>🧊 Confiável ({user.vibeMeters.trustworthy}%)</span>
              </div>
              <div className="barra-base">
                <div 
                  className="barra-preenchida barra-confiavel transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, user.vibeMeters.trustworthy))}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span>❤️ Legal ({user.vibeMeters.cool}%)</span>
              </div>
              <div className="barra-base">
                <div 
                  className="barra-preenchida barra-legal transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, user.vibeMeters.cool))}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span>🌟 Vibe ({user.vibeMeters.sexy}%)</span>
              </div>
              <div className="barra-base">
                <div 
                  className="barra-preenchida barra-vibe transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, user.vibeMeters.sexy))}%` }} 
                />
              </div>
            </div>

            <button
              onClick={onOpenVoteModal}
              className="mt-2 text-xs py-1.5 px-3 rounded-full bg-white/5 hover:bg-white/10 text-[#00BFFF] border border-[#00BFFF]/30 text-center font-bold cursor-pointer transition-all hover:scale-102"
            >
              ⭐ Avaliar Medidores da Vibe
            </button>
          </div>

          {/* 🌟 VITRINE DE AMIGOS FAVORITOS (SEM LIMITE) */}
          <div className="w-full mt-4 pt-4 border-t border-white/10 text-left">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Amigos Favoritos ({topAmigos.length})
              </h3>
              <button
                onClick={handleAdicionarAmigo}
                className="flex items-center gap-1 text-[11px] font-bold text-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 px-2 py-0.5 rounded-full transition-all cursor-pointer"
                title="Favoritar um amigo para a sua vitrine"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Adicionar</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {topAmigos.length === 0 ? (
                <div className="col-span-3 text-center py-3 text-xs text-[#A5A2B8] italic">
                  Nenhum amigo na vitrine ainda. Clique em + Adicionar! 🌟
                </div>
              ) : (
                topAmigos.map((amigo) => (
                  <div
                    key={amigo.id}
                    className="relative group flex flex-col items-center text-center p-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#FF1493] transition-all"
                  >
                    <button
                      onClick={() => handleRemoverAmigo(amigo.id, amigo.amigo_nome)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                      title="Remover da vitrine"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    <img
                      src={amigo.amigo_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={amigo.amigo_nome}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                      }}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#FF1493] shadow-[0_0_8px_rgba(255,20,147,0.4)]"
                    />
                    <span
                      className="text-[11px] text-white font-medium mt-1 truncate max-w-[55px]"
                      title={amigo.amigo_nome}
                    >
                      {amigo.amigo_nome}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* DIREITA: DADOS E MURAL */}
        <main className="card-vibe perfil-direita">
          <div className="perfil-header">
            <h1 className="text-2xl font-black text-white">Quem sou eu</h1>
            <span className="status-tag">{user.currentVibe || "🪐 em órbita no Tribbu'sVibe..."}</span>
          </div>

          <div className="bio-box">
            <p>
              {user.bio || "Colecionadora de câmeras digitais antigas, fã de Avril Lavigne e Charli xcx. Aqui ninguém precisa performar produtividade. Só estou vivendo na minha própria sintonia."}
            </p>
          </div>

          {/* MURAL DE RECADOS */}
          <div className="scraps-box">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>📥 Mural de Scraps públicos ({scraps.length})</span>
              <span className="text-xs font-normal text-[#A5A2B8]">dose retrô y2k</span>
            </h3>
            
            <form onSubmit={handleSubmitScrap} className="caixa-escrever-scrap">
              <textarea 
                placeholder="Deixe um scrap público no mural do seu amigo... ✍️" 
                id="txt-scrap-mural"
                value={scrapText}
                onChange={(e) => setScrapText(e.target.value)}
              />
              <button 
                type="submit"
                className="btn-enviar-scrap flex items-center gap-1.5" 
                id="btn-postar-scrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Scrap</span>
              </button>
            </form>

            <div className="scraps-lista" id="container-scraps">
              {scraps.length === 0 ? (
                <div className="scrap-item text-center py-6 text-sm text-[#A5A2B8]">
                  Nenhum scrap no mural ainda. Seja o primeiro a deixar um recado na vibe! 💌
                </div>
              ) : (
                scraps.map((s) => (
                  <div key={s.id} className="scrap-item group">
                    <div className="scrap-topo">
                      <div className="flex items-center gap-2">
                        <strong className="text-[#00BFFF]">@{s.authorHandle || 'amigo_vibe'}</strong>
                        {s.badge && (
                          <span className="text-[10px] bg-[#FF1493]/20 text-[#FF69B4] px-1.5 py-0.5 rounded-full font-bold">
                            {s.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#A5A2B8]">{s.timestamp}</span>
                        <button
                          onClick={() => onLikeScrap(s.id)}
                          className="text-[#FF69B4] hover:text-[#FF1493] flex items-center gap-1 text-xs cursor-pointer ml-1"
                          title="Curtir scrap"
                        >
                          <Heart className="w-3 h-3 fill-current" />
                          <span>{s.likes}</span>
                        </button>
                        <button
                          onClick={() => onDeleteScrap(s.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 transition-opacity cursor-pointer"
                          title="Remover scrap"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="scrap-texto text-[#f0f0f5]">{s.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
