import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Users, Sparkles, Send, MessageCircle, Heart, Share2, Shield, Calendar, Plus, Check } from 'lucide-react';
import { Community, UserProfile } from '../types';
import { 
  escutarTopicosDaTribo, 
  lancarNovoTopico, 
  enviarRespostaTopico, 
  escutarRespostasDoTopico 
} from '../services/firebase-forum.js';
import { alternarParticipacaoTribo } from '../services/firebase-tribos.js';

interface CommunityDetailViewProps {
  community: Community;
  user: UserProfile;
  onBack: () => void;
  onToggleJoin?: (communityId: string) => void;
}

export const CommunityDetailView: React.FC<CommunityDetailViewProps> = ({
  community,
  user,
  onBack,
  onToggleJoin,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'about'>('posts');
  const [topicos, setTopicos] = useState<any[]>([]);
  const [loadingTopicos, setLoadingTopicos] = useState(true);

  // Status de membro e contagem
  const [isJoined, setIsJoined] = useState<boolean>(community.joined);
  const [membersCount, setMembersCount] = useState<number>(() => {
    const parsed = parseInt(String(community.memberCount).replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  });

  // Formulário de nova postagem
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoConteudo, setNovoConteudo] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [formPostAberto, setFormPostAberto] = useState(false);

  // Gaveta/Modal de discussão de tópico
  const [topicoAberto, setTopicoAberto] = useState<any | null>(null);
  const [respostas, setRespostas] = useState<any[]>([]);
  const [textoResposta, setTextoResposta] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // 🔄 1. Escuta tópicos da comunidade em tempo real
  useEffect(() => {
    setLoadingTopicos(true);
    const unsubscribe = escutarTopicosDaTribo(community.id, (lista) => {
      setTopicos(lista || []);
      setLoadingTopicos(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [community.id]);

  // 💬 2. Escuta respostas do tópico quando selecionado
  useEffect(() => {
    if (!topicoAberto?.id) {
      setRespostas([]);
      return;
    }

    const unsubscribeRespostas = escutarRespostasDoTopico(topicoAberto.id, (listaRespostas) => {
      setRespostas(listaRespostas || []);
    });

    return () => {
      if (typeof unsubscribeRespostas === 'function') unsubscribeRespostas();
    };
  }, [topicoAberto?.id]);

  // 🤝 3. Alternar Participação (Entrar ou Sair da Tribo)
  const handleToggleJoin = async () => {
    const nextJoined = !isJoined;
    setIsJoined(nextJoined);
    setMembersCount((prev) => (nextJoined ? prev + 1 : Math.max(0, prev - 1)));

    if (onToggleJoin) {
      onToggleJoin(community.id);
    }

    showToast(nextJoined ? `🎉 Você agora é membro da tribo "${community.name}"!` : `Você saiu da tribo "${community.name}".`);

    try {
      await alternarParticipacaoTribo(user.id || 'fundador-tribbus-01', community.id);
    } catch (err) {
      console.warn('Erro ao atualizar participação no Firebase:', err);
    }
  };

  // ✍️ 4. Lançar nova postagem na Tribo
  const handleCriarPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim() || !novoConteudo.trim() || isSubmittingPost) return;

    setIsSubmittingPost(true);
    const titulo = novoTitulo.trim();
    const corpo = novoConteudo.trim();

    try {
      const res = await lancarNovoTopico(
        community.id,
        user.id || 'user_lara_123',
        user.name || `@${user.handle}`,
        titulo,
        corpo
      );

      if (res.sucesso) {
        showToast('✨ Postagem lançada na Tribo com sucesso!');
        setNovoTitulo('');
        setNovoConteudo('');
        setFormPostAberto(false);
      } else {
        showToast(`Erro ao postar: ${res.erro || 'Falha ao gravar'}`);
      }
    } catch (err: any) {
      showToast(`Erro: ${err?.message || 'Falha na conexão'}`);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // 💬 5. Enviar Resposta / Comentário no Tópico
  const handleEnviarResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicoAberto?.id || !textoResposta.trim() || isSendingReply) return;

    setIsSendingReply(true);
    const texto = textoResposta.trim();
    setTextoResposta('');

    try {
      await enviarRespostaTopico(
        topicoAberto.id,
        user.id || 'user_lara_123',
        user.name || `@${user.handle}`,
        texto
      );
      showToast('💬 Resposta enviada com sucesso!');
    } catch (err: any) {
      showToast(`Erro ao comentar: ${err?.message || 'Falha'}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Membros fictícios / representativos para a aba de membros
  const membrosExibicao = [
    { id: '1', nome: user.name, handle: `@${user.handle}`, avatar: user.avatar, tag: isJoined ? 'Você (Membro)' : 'Visitante' },
    { id: '2', nome: 'Maju Pixel', handle: '@majupixel', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', tag: 'Moderador' },
    { id: '3', nome: 'Pedro Sampaio', handle: '@pedro_cyber', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80', tag: 'Membro Ativo' },
    { id: '4', nome: 'Carol Stars', handle: '@carolstars', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80', tag: 'Membro VIP' },
  ];

  return (
    <div className="w-full flex flex-col items-center min-h-[calc(100vh-80px)] pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 z-50 bg-[#FF1493] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce border border-white/20">
          <Sparkles className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      <div className="max-w-[1100px] w-full px-4 py-4 sm:py-6 flex flex-col gap-5">
        
        {/* BOTÃO VOLTAR */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#FF1493] bg-white border border-[#FF69B4]/30 hover:bg-[#FFF0F5] px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer hover:-translate-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Todas as Tribos
          </button>

          <span className="text-xs font-semibold text-gray-500 bg-white/70 px-3 py-1.5 rounded-full border border-gray-200">
            Categoria: <strong className="text-[#FF1493]">{community.category || 'Geral'}</strong>
          </span>
        </div>

        {/* 🌟 CABEÇALHO / HERO DA TRIBO */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#FF69B4]/25 shadow-sm p-5 sm:p-7 relative overflow-hidden">
          {/* Banner de Fundo sutil */}
          <div className="absolute top-0 left-0 right-0 h-24 sm:h-28 bg-gradient-to-r from-[#FF1493]/15 via-[#9400D3]/10 to-[#00BFFF]/15 border-b border-[#FF69B4]/20" />

          <div className="relative pt-10 sm:pt-12 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              {/* Emblema Grande */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl border-4 border-[#FF1493] shadow-md flex items-center justify-center text-5xl sm:text-6xl shrink-0 -mt-10 sm:-mt-14 relative z-10">
                {community.avatar}
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#333] flex items-center justify-center sm:justify-start gap-2">
                  <span>{community.name}</span>
                  <Sparkles className="w-5 h-5 text-[#FF1493]" />
                </h1>

                <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl">
                  {community.description || 'Comunidade oficial para debater ideias, compartilhar histórias e trocar vibes!'}
                </p>

                {/* Métricas rápidas */}
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs font-bold text-gray-500">
                  <span className="flex items-center gap-1.5 text-[#00BFFF]">
                    <Users className="w-4 h-4" />
                    {membersCount.toLocaleString()} {membersCount === 1 ? 'membro' : 'membros'}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#FF1493]">
                    <MessageSquare className="w-4 h-4" />
                    {topicos.length} {topicos.length === 1 ? 'discussão' : 'discussões'}
                  </span>
                </div>
              </div>
            </div>

            {/* BOTÃO PARTICIPAR / MEMBRO */}
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleJoin}
                className={`text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-2 ${
                  isJoined
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600'
                    : 'bg-[#FF1493] hover:bg-[#D1107A] text-white border border-[#FF1493] hover:scale-102'
                }`}
              >
                {isJoined ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>✓ Membro da Tribo</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Participar da Tribo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* NAVEGAÇÃO ENTRE ABAS DA TRIBO */}
          <div className="flex items-center gap-2 border-t border-gray-100 mt-6 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'posts'
                  ? 'bg-[#FF1493] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Postagens & Fórum ({topicos.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'members'
                  ? 'bg-[#FF1493] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Membros ({membersCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'about'
                  ? 'bg-[#FF1493] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              Sobre a Tribo
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ABA 1: POSTAGENS & FÓRUM DA TRIBO                         */}
        {/* ========================================================= */}
        {activeTab === 'posts' && (
          <div className="flex flex-col gap-5">
            {/* ÁREA DE CRIAR POSTAGEM / DISCUSSÃO */}
            <div className="bg-white rounded-2xl border border-[#FF69B4]/20 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#FFF0F5] border border-[#FF1493]/30 flex items-center justify-center text-lg">
                    {user.avatar && user.avatar.startsWith('http') ? (
                      <img src={user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      '✍️'
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#333]">Quer compartilhar algo com a Tribo?</h3>
                    <p className="text-[11px] text-gray-500">Inicie um novo tópico ou faça uma postagem para todos os membros lerem.</p>
                  </div>
                </div>

                {!formPostAberto && (
                  <button
                    type="button"
                    onClick={() => setFormPostAberto(true)}
                    className="text-xs font-bold bg-[#FF1493] text-white px-3.5 py-1.5 rounded-xl hover:bg-[#D1107A] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Postagem
                  </button>
                )}
              </div>

              {formPostAberto && (
                <form onSubmit={handleCriarPost} className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Título da Discussão:
                    </label>
                    <input
                      type="text"
                      value={novoTitulo}
                      onChange={(e) => setNovoTitulo(e.target.value)}
                      placeholder="Ex: O que vocês acham do novo lançamento retrô? 💿"
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 bg-[#FAFAFA] focus:outline-hidden focus:border-[#FF1493] text-gray-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Conteúdo / Mensagem da Postagem:
                    </label>
                    <textarea
                      value={novoConteudo}
                      onChange={(e) => setNovoConteudo(e.target.value)}
                      placeholder="Escreva sua mensagem completa para a comunidade..."
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 bg-[#FAFAFA] focus:outline-hidden focus:border-[#FF1493] text-gray-800 h-28 resize-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormPostAberto(false)}
                      className="text-xs font-bold text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100 cursor-pointer"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmittingPost}
                      className="text-xs sm:text-sm font-bold bg-[#FF1493] hover:bg-[#D1107A] text-white px-5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {isSubmittingPost ? 'Lançando...' : 'Lançar Postagem ✨'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* LISTA DE POSTAGENS EM TEMPO REAL */}
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-[#4A4A4A] flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#FF1493]" />
                  <span>Discussões & Postagens Recentes</span>
                </h3>
                <span className="text-[11px] text-gray-500">Feed Cronológico Antialgoritmo</span>
              </div>

              {loadingTopicos && (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                  <div className="animate-spin w-6 h-6 border-2 border-[#FF1493] border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-semibold">Carregando postagens da tribo...</p>
                </div>
              )}

              {!loadingTopicos && topicos.length === 0 && (
                <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-[#FF69B4]/30 shadow-xs flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#FFF0F5] rounded-full flex items-center justify-center text-3xl mb-3">
                    {community.avatar}
                  </div>
                  <h4 className="text-base font-bold text-gray-700">Nenhuma postagem ainda nesta Tribo</h4>
                  <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
                    Essa comunidade está pronta para as melhores ideias! Seja a primeira pessoa a lançar um tópico.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormPostAberto(true)}
                    className="text-xs font-bold bg-[#FF1493] text-white px-4 py-2 rounded-xl hover:bg-[#D1107A] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Abrir Primeiro Tópico
                  </button>
                </div>
              )}

              {/* CARDS DE CADA POSTAGEM */}
              {!loadingTopicos && topicos.map((topico) => {
                const isExpanded = topicoAberto?.id === topico.id;
                return (
                  <div
                    key={topico.id}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-[#FF69B4]/30 shadow-xs p-5 transition-all flex flex-col gap-3"
                  >
                    {/* Autor e Data */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#FFF0F5] border border-[#FF1493]/30 flex items-center justify-center font-bold text-xs text-[#FF1493]">
                          {topico.autor_name ? topico.autor_name.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-800 block">
                            {topico.autor_name || '@membro_da_tribo'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {topico.data_criacao ? new Date(topico.data_criacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recentemente'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-[#00BFFF] bg-[#00BFFF]/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {topico.respostas_contador || 0} {(topico.respostas_contador || 0) === 1 ? 'resposta' : 'respostas'}
                      </span>
                    </div>

                    {/* Título e Conteúdo */}
                    <div>
                      <h4 className="text-base font-bold text-[#222] mb-1.5">
                        {topico.titulo_topico || 'Discussão na Tribo'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {topico.conteudo_inicial || topico.conteudo_texto || ''}
                      </p>
                    </div>

                    {/* Botão para Expandir / Comentar */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (isExpanded) {
                            setTopicoAberto(null);
                          } else {
                            setTopicoAberto(topico);
                          }
                        }}
                        className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                          isExpanded
                            ? 'bg-[#FF1493] text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-[#FFF0F5] text-gray-700 hover:text-[#FF1493]'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {isExpanded ? 'Ocultar Respostas' : 'Ver Discussão & Comentar'}
                      </button>

                      <span className="text-[10px] text-gray-400 font-medium">
                        ID: {topico.id.slice(0, 8)}...
                      </span>
                    </div>

                    {/* GAVETA DE RESPOSTAS EXPANSÍVEL */}
                    {isExpanded && (
                      <div className="mt-2 pt-3 border-t border-[#FF69B4]/20 flex flex-col gap-3 bg-[#FAFAFA] p-3.5 rounded-xl">
                        <h5 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <span>💬 Respostas da Comunidade ({respostas.length})</span>
                        </h5>

                        {/* Lista de Respostas */}
                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                          {respostas.length === 0 && (
                            <p className="text-xs text-gray-500 text-center py-4 italic">
                              Nenhuma resposta ainda. Seja o primeiro a opinar! 👇
                            </p>
                          )}

                          {respostas.map((r) => (
                            <div
                              key={r.id}
                              className="bg-white p-2.5 rounded-xl border border-gray-200 text-xs shadow-2xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-[#FF1493] text-[11px]">
                                  {r.autor_name || '@membro'}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {r.data_envio ? new Date(r.data_envio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                                </span>
                              </div>
                              <p className="text-gray-700 text-xs leading-normal">{r.conteudo_texto}</p>
                            </div>
                          ))}
                        </div>

                        {/* Formulário de Resposta */}
                        <form onSubmit={handleEnviarResposta} className="flex gap-2 mt-1">
                          <input
                            type="text"
                            value={textoResposta}
                            onChange={(e) => setTextoResposta(e.target.value)}
                            placeholder="Deixe sua resposta ou comentário... 💬"
                            className="flex-1 text-xs py-2 px-3 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:border-[#FF1493]"
                            required
                          />
                          <button
                            type="submit"
                            disabled={isSendingReply}
                            className="bg-[#00BFFF] hover:bg-[#0099CC] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            {isSendingReply ? '...' : 'Enviar'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2: MEMBROS DA TRIBO                                   */}
        {/* ========================================================= */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-800">Membros da Tribo</h3>
                <p className="text-xs text-gray-500">Pessoas que se identificam com essa comunidade.</p>
              </div>
              <span className="text-xs font-bold text-[#00BFFF] bg-[#00BFFF]/10 px-3 py-1.5 rounded-full">
                {membersCount} {membersCount === 1 ? 'membro cadastrado' : 'membros cadastrados'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mt-2">
              {membrosExibicao.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-gray-100 hover:border-[#FF69B4]/30 bg-[#FAFAFA] flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#FF1493]/30 group-hover:scale-105 transition-transform bg-white flex items-center justify-center font-bold text-xl text-[#FF1493]">
                    {m.avatar && m.avatar.startsWith('http') ? (
                      <img src={m.avatar} alt={m.nome} className="w-full h-full object-cover" />
                    ) : (
                      m.avatar || '🤠'
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{m.nome}</h4>
                    <span className="text-[10px] text-gray-400 block">{m.handle}</span>
                  </div>

                  <span className="text-[10px] font-bold text-[#FF1493] bg-[#FFF0F5] px-2 py-0.5 rounded-full">
                    {m.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: SOBRE A TRIBO & REGRAS                             */}
        {/* ========================================================= */}
        {activeTab === 'about' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col gap-4">
            <h3 className="text-base font-bold text-gray-800">Sobre esta Comunidade</h3>
            <div className="text-xs sm:text-sm text-gray-600 leading-relaxed flex flex-col gap-3">
              <p>
                <strong>Propósito:</strong> {community.description || 'Espaço de união, conversas e troca de ideias autênticas sem algoritmos forçados.'}
              </p>
              <div className="p-4 rounded-xl bg-[#FFF0F5] border border-[#FF69B4]/20 flex flex-col gap-1.5 text-xs text-[#4A4A4A]">
                <strong className="text-[#FF1493] flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Regras da Tribo:
                </strong>
                <p>1. Respeite todos os membros e suas opiniões.</p>
                <p>2. Mantenha os tópicos e postagens alinhados com o tema da Tribo.</p>
                <p>3. Não é permitido spam ou conteúdo ofensivo.</p>
                <p>4. Espalhe boa vibe, comente com frequência e faça amizades!</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
