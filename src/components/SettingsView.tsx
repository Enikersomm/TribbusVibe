import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Sparkles, User, Camera, Check, ArrowLeft, Heart, ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';
import { salvarConfiguracoesPerfil, buscarDadosConfiguracao } from '../services/firebase-configuracoes';

interface SettingsViewProps {
  user: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
  onNavigateToTab: (tab: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onSaveProfile,
  onNavigateToTab,
}) => {
  const [name, setName] = useState(user.name);
  const [currentVibe, setCurrentVibe] = useState(user.currentVibe);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [trustworthy, setTrustworthy] = useState(user.vibeMeters.trustworthy);
  const [cool, setCool] = useState(user.vibeMeters.cool);
  const [sexy, setSexy] = useState(user.vibeMeters.sexy);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 📥 CARREGAR DADOS ATUAIS DO FIRESTORE QUANDO ABRIR A TELA
  useEffect(() => {
    const usuarioId = user.id || 'fundador-tribbus-01';
    buscarDadosConfiguracao(usuarioId).then((res) => {
      if (res && res.sucesso && res.dados) {
        const dados = res.dados;
        if (dados.nome) setName(dados.nome);
        if (dados.status_vibe) setCurrentVibe(dados.status_vibe);
        if (dados.bio) setBio(dados.bio);
        if (dados.avatar_url) setAvatar(dados.avatar_url);
        if (typeof dados.medidor_confiavel === 'number') setTrustworthy(dados.medidor_confiavel);
        if (typeof dados.medidor_legal === 'number') setCool(dados.medidor_legal);
        if (typeof dados.medidor_vibe === 'number') setSexy(dados.medidor_vibe);
      }
    }).catch((err) => {
      console.warn('Carregamento inicial de configurações:', err);
    });
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const dadosAtualizadosLocal: Partial<UserProfile> = {
      name: name.trim() || user.name,
      currentVibe: currentVibe.trim() || user.currentVibe,
      bio: bio.trim() || user.bio,
      avatar: avatar.trim() || user.avatar,
      vibeMeters: {
        trustworthy: Number(trustworthy),
        cool: Number(cool),
        sexy: Number(sexy),
      },
    };

    // Atualiza estado local da aplicação
    onSaveProfile(dadosAtualizadosLocal);

    // 🛠️ SALVAR CONFIGURAÇÕES NO FIRESTORE COM A FUNÇÃO OFICIAL
    const usuarioId = user.id || 'fundador-tribbus-01';
    await salvarConfiguracoesPerfil(usuarioId, {
      nome: name.trim() || user.name,
      status_vibe: currentVibe.trim() || user.currentVibe,
      bio: bio.trim() || user.bio,
      avatar_url: avatar.trim() || user.avatar,
      medidor_confiavel: Number(trustworthy),
      medidor_legal: Number(cool),
      medidor_vibe: Number(sexy),
    });

    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces',
  ];

  return (
    <div className="w-full max-w-[720px] mx-auto py-6 px-4">
      {/* Botão de retorno rápido */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => onNavigateToTab('scraps')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF1493] hover:text-[#9400D3] bg-white px-3 py-1.5 rounded-full border border-[#FF69B4]/20 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para Meu Perfil</span>
        </button>

        <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
          Edição instantânea em tempo real
        </span>
      </div>

      <main className="bg-white p-6 sm:p-8 rounded-[24px] border border-[#FF69B4]/20 shadow-[0_10px_30px_rgba(255,20,147,0.06)]">
        {/* Título com ícone em degradê neon */}
        <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2.5 text-[#4A4A4A]">
          <span className="text-gradient-neon flex items-center justify-center">
            <SlidersHorizontal className="w-6 h-6 text-[#FF1493]" />
          </span>
          <span>Configurações da Minha Vibe</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SEÇÃO 1: IDENTIDADE */}
          <div className="border-b border-[#FFF0F5] pb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF1493]" />
              Identidade Visual
            </h3>

            {/* Prévia do Avatar com link e presets rápidos */}
            <div className="mb-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 p-3.5 bg-[#FFF0F5]/50 rounded-2xl border border-[#FF69B4]/15">
              <div className="relative shrink-0">
                <img
                  src={avatar || user.avatar}
                  alt={name}
                  className="w-18 h-18 rounded-2xl object-cover border-2 border-white shadow-md"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = user.avatar;
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full" />
              </div>

              <div className="flex-1 w-full text-center sm:text-left">
                <label className="text-xs font-bold text-[#555] block mb-1">
                  Foto de Perfil (URL da Imagem)
                </label>
                <div className="relative mb-2">
                  <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://exemplo.com/minha-foto.jpg"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#EAEAEA] rounded-lg text-[#4A4A4A] focus:outline-hidden focus:border-[#00BFFF] transition-colors"
                  />
                </div>
                {/* Presets de avatar estilo Y2K */}
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-400">Exemplos:</span>
                  {avatarPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(preset)}
                      className="w-6 h-6 rounded-full overflow-hidden border border-white hover:scale-115 transition-transform cursor-pointer shadow-2xs"
                      title={`Selecionar foto ${idx + 1}`}
                    >
                      <img src={preset} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="input-nome" className="text-xs font-bold text-[#555]">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  id="input-nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-[#EAEAEA] rounded-[10px] text-sm bg-[#FAFAFA] text-[#4A4A4A] focus:outline-hidden focus:border-[#00BFFF] transition-colors"
                  placeholder="Seu nome"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="input-status" className="text-xs font-bold text-[#555]">
                  Status Atual (Vibe)
                </label>
                <input
                  type="text"
                  id="input-status"
                  value={currentVibe}
                  onChange={(e) => setCurrentVibe(e.target.value)}
                  className="w-full p-3 border border-[#EAEAEA] rounded-[10px] text-sm bg-[#FAFAFA] text-[#4A4A4A] focus:outline-hidden focus:border-[#00BFFF] transition-colors"
                  placeholder="🪐 em órbita..."
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="input-bio" className="text-xs font-bold text-[#555]">
                  Quem Sou Eu (Bio)
                </label>
                <textarea
                  id="input-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full h-24 p-3 border border-[#EAEAEA] rounded-[10px] text-sm bg-[#FAFAFA] text-[#4A4A4A] focus:outline-hidden focus:border-[#00BFFF] transition-colors resize-none leading-relaxed"
                  placeholder="Conte um pouco sobre suas paixões, bandas favoritas e o que você curte..."
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: REPUTAÇÃO (DOSE RETRÔ) */}
          <div className="border-b border-[#FFF0F5] pb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#00BFFF]" />
              Meus Termômetros (Modo Teste)
            </h3>

            <div className="space-y-4">
              {/* Confiabilidade */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#555]">
                  <span className="flex items-center gap-1.5">
                    <span>🧊</span>
                    <span>Nível de Confiabilidade</span>
                  </span>
                  <span className="text-xs font-bold text-[#FF1493] w-12 text-right">
                    {trustworthy}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trustworthy}
                    onChange={(e) => setTrustworthy(Number(e.target.value))}
                    className="flex-1 accent-[#9400D3] cursor-pointer h-2 bg-gray-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Legal */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#555]">
                  <span className="flex items-center gap-1.5">
                    <span>❤️</span>
                    <span>Nível de Legal</span>
                  </span>
                  <span className="text-xs font-bold text-[#FF1493] w-12 text-right">
                    {cool}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={cool}
                    onChange={(e) => setCool(Number(e.target.value))}
                    className="flex-1 accent-[#9400D3] cursor-pointer h-2 bg-gray-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Energia da Vibe */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#555]">
                  <span className="flex items-center gap-1.5">
                    <span>🌟</span>
                    <span>Energia da Vibe</span>
                  </span>
                  <span className="text-xs font-bold text-[#FF1493] w-12 text-right">
                    {sexy}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sexy}
                    onChange={(e) => setSexy(Number(e.target.value))}
                    className="flex-1 accent-[#9400D3] cursor-pointer h-2 bg-gray-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BOTÃO DE SALVAMENTO COM O DEGRADÊ REFINADO */}
          <button
            type="submit"
            disabled={isSaving}
            className={`btn-salvar-config flex items-center justify-center gap-2 ${
              isSaving ? 'opacity-80 cursor-wait' : ''
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-5 h-5 text-white animate-spin" />
                <span>Sincronizando com o Firestore...</span>
              </>
            ) : isSaved ? (
              <>
                <Check className="w-5 h-5 text-white animate-bounce" />
                <span>Alterações Salvas com Sucesso!</span>
              </>
            ) : (
              <span>Salvar Minhas Alterações</span>
            )}
          </button>

          {isSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Seu perfil foi atualizado em tempo real no Tribbu'sVibe!
              </span>
              <button
                type="button"
                onClick={() => onNavigateToTab('scraps')}
                className="underline hover:text-emerald-900 cursor-pointer ml-2"
              >
                Ver Meu Perfil &rarr;
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};
