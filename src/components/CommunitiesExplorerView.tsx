import React, { useState } from 'react';
import { Compass, PlusCircle, Search, Users, Check, Sparkles } from 'lucide-react';
import { Community } from '../types';

interface CommunitiesExplorerViewProps {
  communities: Community[];
  onToggleCommunity: (id: string) => void;
  onCreateCommunity: (newCommunity: { name: string; description: string; avatar: string }) => void;
  onOpenCommunity?: (id: string) => void;
  onNavigateToFeed?: () => void;
  onNavigateToProfile?: () => void;
}

export const CommunitiesExplorerView: React.FC<CommunitiesExplorerViewProps> = ({
  communities,
  onToggleCommunity,
  onCreateCommunity,
  onOpenCommunity,
  onNavigateToFeed,
  onNavigateToProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [nomeTribo, setNomeTribo] = useState('');
  const [descTribo, setDescTribo] = useState('');
  const [iconeTribo, setIconeTribo] = useState('');
  const [createdSuccessToast, setCreatedSuccessToast] = useState<string | null>(null);

  const filteredCommunities = communities.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term)) ||
      c.category.toLowerCase().includes(term)
    );
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeTribo.trim() || !descTribo.trim()) return;

    const emoji = iconeTribo.trim() || '🪐';
    onCreateCommunity({
      name: nomeTribo.trim(),
      description: descTribo.trim(),
      avatar: emoji,
    });

    setCreatedSuccessToast(`Tribo "${nomeTribo.trim()}" lançada com sucesso! ✨`);
    setTimeout(() => setCreatedSuccessToast(null), 4000);

    setNomeTribo('');
    setDescTribo('');
    setIconeTribo('');
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Toast de Sucesso */}
      {createdSuccessToast && (
        <div className="fixed top-20 z-50 bg-emerald-500 text-white font-bold px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{createdSuccessToast}</span>
        </div>
      )}

      <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 px-4 py-6">
        
        {/* COLUNA ESQUERDA: EXPLORAR */}
        <main className="bg-white p-6 sm:p-7 rounded-[20px] border border-[#FF69B4]/15 shadow-[0_8px_24px_rgba(255,20,147,0.05)]">
          <h2 className="text-[#4A4A4A] text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-[#FF1493]" />
            <span>Descubra Novas Tribbu's</span>
          </h2>

          {/* Barra de Busca */}
          <div className="flex gap-2.5 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="O que você está a fim de debater hoje? (Sem algoritmos interferindo...)"
                className="w-full py-3 px-4 pl-4 text-sm bg-[#FAFAFA] border border-[#EAEAEA] rounded-full focus:outline-none focus:border-[#FF1493] transition-all text-[#4A4A4A]"
              />
            </div>
            <button
              onClick={() => {}}
              className="bg-[#00BFFF] hover:bg-[#009cd0] text-white font-bold px-6 py-3 rounded-full text-sm transition-all cursor-pointer shadow-sm hover:shadow"
            >
              Buscar
            </button>
          </div>

          {/* Grade de Tribos Descobertas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredCommunities.map((tribo) => (
              <div
                key={tribo.id}
                className="bg-[#FAFAFA] border border-[#EAEAEA] hover:border-[#FF1493] rounded-2xl p-4 text-center flex flex-col items-center gap-2.5 transition-all duration-200 hover:-translate-y-1 cursor-pointer group shadow-2xs hover:shadow-md"
                onClick={() => {
                  if (onOpenCommunity) {
                    onOpenCommunity(tribo.id);
                  } else {
                    onToggleCommunity(tribo.id);
                  }
                }}
              >
                <div className="w-[60px] h-[60px] bg-[#FFF0F5] border border-[#FF69B4]/20 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {tribo.avatar}
                </div>

                <h4 className="text-base font-bold text-[#333] group-hover:text-[#FF1493] transition-colors line-clamp-1">
                  {tribo.name}
                </h4>

                <p className="text-xs text-[#777] leading-relaxed line-clamp-2 h-9">
                  {tribo.description || `Comunidade oficial de ${tribo.category}. Entre e veja as postagens ou participe da conversa.`}
                </p>

                <div className="w-full pt-2 mt-auto border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-[#00BFFF] font-bold">
                    {tribo.memberCount} membros
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCommunity(tribo.id);
                    }}
                    className={`text-xs px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                      tribo.joined
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                        : 'bg-[#FF1493] text-white hover:bg-[#D1107A]'
                    }`}
                  >
                    {tribo.joined ? 'Membro ✓' : 'Entrar +'}
                  </button>
                </div>
              </div>
            ))}

            {filteredCommunities.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-[#FAFAFA] rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm">Nenhuma tribo encontrada para "{searchTerm}".</p>
                <p className="text-xs text-[#FF1493] mt-1 font-bold">Que tal ser o primeiro a criar essa tribo no painel ao lado?</p>
              </div>
            )}
          </div>
        </main>

        {/* COLUNA DIREITA: CRIAR */}
        <aside id="formulario-criar" className="bg-white p-6 sm:p-7 rounded-[20px] border border-[#FF69B4]/15 shadow-[0_8px_24px_rgba(255,20,147,0.05)] h-fit scroll-mt-20">
          <h2 className="text-[#4A4A4A] text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2.5">
            <PlusCircle className="w-6 h-6 text-[#FF1493]" />
            <span>Iniciar uma Tribo</span>
          </h2>

          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="nome-tribo" className="block text-xs font-bold text-[#666] mb-1.5">
                Nome da Tribo
              </label>
              <input
                id="nome-tribo"
                type="text"
                value={nomeTribo}
                onChange={(e) => setNomeTribo(e.target.value)}
                placeholder="Ex: Fãs de Avril Lavigne"
                className="w-full p-3 bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg text-sm focus:outline-none focus:border-[#FF1493] transition-all text-[#4A4A4A]"
                required
              />
            </div>

            <div>
              <label htmlFor="desc-tribo" className="block text-xs font-bold text-[#666] mb-1.5">
                O que a galera faz aqui?
              </label>
              <textarea
                id="desc-tribo"
                value={descTribo}
                onChange={(e) => setDescTribo(e.target.value)}
                placeholder="Descreva as regras e o assunto da comu..."
                className="w-full p-3 bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg text-sm focus:outline-none focus:border-[#FF1493] transition-all text-[#4A4A4A] h-24 resize-none"
                required
              />
            </div>

            <div>
              <label htmlFor="icone-tribo" className="block text-xs font-bold text-[#666] mb-1.5">
                Emoji Temático (Ícone)
              </label>
              <input
                id="icone-tribo"
                type="text"
                value={iconeTribo}
                onChange={(e) => setIconeTribo(e.target.value)}
                placeholder="Ex: 🎸"
                maxLength={4}
                className="w-full p-3 bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg text-sm focus:outline-none focus:border-[#FF1493] transition-all text-[#4A4A4A]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-[#FF1493] hover:bg-[#D1107A] text-white p-3 rounded-full font-bold text-base transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_4px_12px_rgba(255,20,147,0.25)]"
            >
              Lançar Minha Tribo
            </button>
          </form>
        </aside>

      </div>
    </div>
  );
};
