import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { 
  postarMicroVibe, 
  escutarFeedTempoReal, 
  curtirPost,
  enviarComentarioPost,
  escutarComentariosDoPost
} from '../services/firebase-config';
import {
  postarStoryComunidade,
  escutarStoriesAtivos,
  escutarComentariosDoStory,
  adicionarComentarioNoStory
} from '../services/firebase-stories.js';
import { fazerUploadDeFoto } from '../services/firebase-storage.js';
import { escutarTribosDoBanco } from '../services/firebase-tribos.js';

export interface StoryComunidade {
  id: string;
  autor_id: string;
  comunidade_id: string;
  media_url?: string;
  tipo?: 'foto' | 'texto' | 'musica';
  texto_vibe?: string;
  trilha_musica?: string;
  data_criacao: string;
  expires_at: string;
  autor_nome?: string;
  autor_avatar?: string;
  comunidade_nome?: string;
}
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Image as ImageIcon, 
  Music, 
  MoreHorizontal, 
  Calendar, 
  MapPin, 
  Video, 
  UserPlus,
  Compass,
  Plus,
  X,
  Sparkles,
  Camera,
  Clock,
  ExternalLink
} from 'lucide-react';

interface HomeViewProps {
  user: UserProfile;
  onNavigateToProfile: () => void;
  onNavigateToCommunities: () => void;
  onOpenCommunity?: (communityId: string) => void;
}

interface FeedPost {
  id: string;
  autorNome: string;
  autorHandle: string;
  autorAvatar: string;
  tempo: string;
  texto: string;
  imagem?: string;
  curtidas: number;
  comentarios: number;
  curtido: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  onNavigateToProfile,
  onNavigateToCommunities,
  onOpenCommunity,
}) => {
  // Estado da Caixa de Postar Micro-Vibe
  const [novoVibeTexto, setNovoVibeTexto] = useState('');
  const [posts, setPosts] = useState<FeedPost[]>([
    {
      id: 'p1',
      autorNome: user.name,
      autorHandle: `@${user.handle}`,
      autorAvatar: user.avatar,
      tempo: '2h atrás',
      texto: 'Mais um dia explorando ruínas esquecidas pelo tempo. A adrenalina de decifrar enigmas milenares nunca perde a graça! 🏛️🧭🗺️',
      imagem: 'https://images.unsplash.com/photo-1509225770129-fbcf8a696c0b?auto=format&fit=crop&w=800&q=80',
      curtidas: 142,
      comentarios: 28,
      curtido: true,
    },
    {
      id: 'p2',
      autorNome: 'Nathan Drake',
      autorHandle: '@nate_fortune',
      autorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      tempo: '5h atrás',
      texto: 'Disseram que esse tesouro era apenas um mito. Alguém aí quer apostar um café em como eu acho antes do fim da semana? ☕💎',
      curtidas: 89,
      comentarios: 14,
      curtido: false,
    },
    {
      id: 'p3',
      autorNome: 'Marina Pixel',
      autorHandle: '@marina_retro',
      autorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      tempo: '6h atrás',
      texto: 'Finalizando minha coleção de fotos analógicas reveladas em filme 35mm! Quem quiser ver os resultados entra na comu de Fotografia Analógica 📷✨',
      curtidas: 112,
      comentarios: 35,
      curtido: false,
    },
  ]);

  // Stories das Comunidades
  const [activeStories, setActiveStories] = useState<StoryComunidade[]>([]);
  const [storyVisualizando, setStoryVisualizando] = useState<StoryComunidade | null>(null);
  const [comentariosStory, setComentariosStory] = useState<any[]>([]);
  const [novoComentarioStory, setNovoComentarioStory] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [modalNovoStory, setModalNovoStory] = useState(false);
  const [comunidadeStoryId, setComunidadeStoryId] = useState('geral');
  const [mediaStoryUrl, setMediaStoryUrl] = useState('');
  const [isPostandoStory, setIsPostandoStory] = useState(false);
  const [storyMsg, setStoryMsg] = useState<string | null>(null);

  // 🪐 Estado do Mural de Vibes Flexível (Stories das Tribos)
  const [tipoVibe, setTipoVibe] = useState<'foto' | 'texto' | 'musica'>('foto');
  const [painelVibeAberto, setPainelVibeAberto] = useState(true);
  const [inputVibeDado, setInputVibeDado] = useState('');
  const [vibeFotoPreview, setVibeFotoPreview] = useState<string>('');
  const [vibeFeedbackMsg, setVibeFeedbackMsg] = useState<string | null>(null);
  const fileVibeInputRef = useRef<HTMLInputElement | null>(null);

  // Comentários do Feed Principal (Gaveta de Respostas)
  const [postComentariosAberto, setPostComentariosAberto] = useState<string | null>(null);
  const [comentariosDoPostAtual, setComentariosDoPostAtual] = useState<any[]>([]);
  const [textoNovoComentarioPost, setTextoNovoComentarioPost] = useState('');
  const [enviandoComentarioPost, setEnviandoComentarioPost] = useState(false);

  const comunidadesDisponiveis = [
    { id: 'comu_no_early', nome: 'No Early', emoji: '🥱', cor: '#FF1493' },
    { id: 'comu_analog', nome: 'Analog', emoji: '📷', cor: '#00BFFF' },
    { id: 'comu_ps2', nome: 'PS2 Rock', emoji: '🎸', cor: '#9400D3' },
    { id: 'comu_coffee', nome: 'CoffeeCode', emoji: '☕', cor: '#FF8C00' },
    { id: 'comu_glitter', nome: 'Glitter Y2K', emoji: '💿', cor: '#FF1493' },
    { id: 'comu_skate', nome: 'Skate 2000', emoji: '🛹', cor: '#00FA9A' },
  ];

  const presetsImagens = [
    { label: 'Y2K Cyber', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80' },
    { label: 'Analog Camera', url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80' },
    { label: 'Retro Arcade', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80' },
    { label: 'Café Dev', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80' },
  ];

  // Sincronização em Tempo Real do Feed e dos Stories com o Firestore
  useEffect(() => {
    // 1. Escuta Feed
    const unsubscribeFeed = escutarFeedTempoReal((postsFirestore: any[]) => {
      if (postsFirestore && postsFirestore.length > 0) {
        const postsMapeados: FeedPost[] = postsFirestore.map((p) => ({
          id: p.id,
          autorNome: p.autor_nome || p.autor_name || 'Membro Vibe',
          autorHandle: `@${(p.autor_nome || p.autor_name || 'viber').toLowerCase().replace(/\s+/g, '_')}`,
          autorAvatar: p.autor_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          tempo: 'há pouco',
          texto: p.conteudo_texto || p.texto || '',
          imagem: p.imagem_url || p.imagem,
          curtidas: p.curtidas_contador ?? p.curtidas ?? 0,
          comentarios: p.comentarios_contador ?? p.comentarios ?? 0,
          curtido: false,
        }));
        setPosts(postsMapeados);
      }
    });

    // 2. Escuta Stories Ativos (últimas 24h)
    const unsubscribeStories = escutarStoriesAtivos((storiesAtivos: any[]) => {
      if (storiesAtivos) {
        setActiveStories(storiesAtivos);
      }
    });

    return () => {
      if (typeof unsubscribeFeed === 'function') unsubscribeFeed();
      if (typeof unsubscribeStories === 'function') unsubscribeStories();
    };
  }, []);

  // 💬 Escuta em tempo real os comentários do story visualizado
  useEffect(() => {
    if (!storyVisualizando?.id) {
      setComentariosStory([]);
      return;
    }

    const unsub = escutarComentariosDoStory(storyVisualizando.id, (coms: any[]) => {
      setComentariosStory(coms);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [storyVisualizando?.id]);

  // 💬 Escuta em tempo real os comentários do post do feed selecionado
  useEffect(() => {
    if (!postComentariosAberto) {
      setComentariosDoPostAtual([]);
      return;
    }

    const unsub = escutarComentariosDoPost(postComentariosAberto, (coms: any[]) => {
      setComentariosDoPostAtual(coms || []);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [postComentariosAberto]);

  const handleToggleGavetaComentarios = (postId: string) => {
    if (postComentariosAberto === postId) {
      setPostComentariosAberto(null);
    } else {
      setPostComentariosAberto(postId);
      setTextoNovoComentarioPost('');
    }
  };

  const handleEnviarComentarioDoFeed = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!postId || !textoNovoComentarioPost.trim() || enviandoComentarioPost) return;

    setEnviandoComentarioPost(true);
    const texto = textoNovoComentarioPost.trim();
    setTextoNovoComentarioPost('');

    try {
      await enviarComentarioPost(
        postId,
        user.id || 'user_lara_123',
        user.name || `@${user.handle}` || 'Membro da Tribo',
        texto
      );
    } catch (err) {
      console.error('Erro ao enviar comentário no post do feed:', err);
    } finally {
      setEnviandoComentarioPost(false);
    }
  };

  const handleEnviarComentarioStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyVisualizando?.id || !novoComentarioStory.trim() || enviandoComentario) return;

    setEnviandoComentario(true);
    const texto = novoComentarioStory.trim();
    setNovoComentarioStory('');

    try {
      await adicionarComentarioNoStory(
        storyVisualizando.id,
        user.id || 'user_anon',
        user.name || `@${user.handle}` || 'Membro da Tribo',
        texto
      );
    } catch (err) {
      console.error('Erro ao postar comentário no story:', err);
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setVibeFotoPreview(reader.result);
        setInputVibeDado(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDispararVibe = async () => {
    setIsPostandoStory(true);
    setVibeFeedbackMsg(null);

    let mediaUrlParaEnviar = '';
    let textoVibeParaEnviar = '';
    let trilhaMusicaParaEnviar = '';

    if (tipoVibe === 'foto') {
      if (!vibeFotoPreview && !inputVibeDado.trim()) {
        setVibeFeedbackMsg('Por favor, selecione uma foto ou cole uma URL de imagem.');
        setIsPostandoStory(false);
        return;
      }
      mediaUrlParaEnviar = vibeFotoPreview || inputVibeDado.trim();
    } else if (tipoVibe === 'texto') {
      if (!inputVibeDado.trim()) {
        setVibeFeedbackMsg('Por favor, digite o seu texto neon para o mural.');
        setIsPostandoStory(false);
        return;
      }
      textoVibeParaEnviar = inputVibeDado.trim();
    } else if (tipoVibe === 'musica') {
      if (!inputVibeDado.trim()) {
        setVibeFeedbackMsg('Por favor, informe a trilha sonora ou artista.');
        setIsPostandoStory(false);
        return;
      }
      trilhaMusicaParaEnviar = inputVibeDado.trim();
    }

    try {
      const res = await postarStoryComunidade(
        user.id || 'user_lara_123',
        comunidadeStoryId || 'geral',
        mediaUrlParaEnviar,
        {
          autor_nome: user.name || 'Membro da Tribo',
          autor_avatar: user.avatar || '',
          comunidade_nome: comunidadesDisponiveis.find((c) => c.id === comunidadeStoryId)?.nome || 'Geral',
          tipo: tipoVibe,
          texto_vibe: textoVibeParaEnviar,
          trilha_musica: trilhaMusicaParaEnviar,
        }
      );

      if (res.sucesso) {
        setVibeFeedbackMsg('✨ Vibe lançada no Mural com sucesso (ativa por 24h)!');
        setInputVibeDado('');
        setVibeFotoPreview('');
        setTimeout(() => setVibeFeedbackMsg(null), 3500);
      } else {
        setVibeFeedbackMsg(`Aviso: ${res.erro || 'Não foi possível salvar vibe'}`);
      }
    } catch (err: any) {
      setVibeFeedbackMsg(`Erro ao publicar: ${err?.message || err}`);
    } finally {
      setIsPostandoStory(false);
    }
  };

  const handleLancarStory = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = mediaStoryUrl.trim() || presetsImagens[0].url;
    setIsPostandoStory(true);
    setStoryMsg(null);

    try {
      const res = await postarStoryComunidade(
        user.id || 'user_lara_123',
        comunidadeStoryId,
        url
      );

      if (res.sucesso) {
        setStoryMsg('✨ Story postado na Tribo com sucesso (ativo por 24h)!');
        setMediaStoryUrl('');
        setTimeout(() => {
          setModalNovoStory(false);
          setStoryMsg(null);
        }, 1200);
      } else {
        setStoryMsg(`Aviso: ${res.erro || 'Não foi possível salvar story'}`);
      }
    } catch (err: any) {
      setStoryMsg(`Erro ao publicar story: ${err?.message || err}`);
    } finally {
      setIsPostandoStory(false);
    }
  };

  const handlePostar = async () => {
    const texto = novoVibeTexto.trim();
    if (!texto) return;

    setNovoVibeTexto('');

    try {
      await postarMicroVibe(user.id || 'user_lara_123', user.name || '@tombraider', texto);
    } catch (err) {
      console.warn('[TribbusVibe] Erro ao postar no feed:', err);
      // Fallback local se estiver offline
      const novoPost: FeedPost = {
        id: `p_${Date.now()}`,
        autorNome: user.name,
        autorHandle: `@${user.handle}`,
        autorAvatar: user.avatar,
        tempo: 'Agora mesmo',
        texto,
        curtidas: 0,
        comentarios: 0,
        curtido: false,
      };
      setPosts([novoPost, ...posts]);
    }
  };

  const handleToggleCurtida = async (id: string) => {
    // Efeito otimista local
    setPosts(
      posts.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            curtido: !p.curtido,
            curtidas: p.curtido ? p.curtidas - 1 : p.curtidas + 1,
          };
        }
        return p;
      })
    );

    try {
      await curtirPost(id);
    } catch (err) {
      console.warn('[TribbusVibe] Erro ao salvar curtida:', err);
    }
  };

  return (
    <div className="main-layout">
      {/* 🪐 COMPONENTE ATUALIZADO: MURAL DE VIBES FLEXÍVEL (STORIES DAS TRIBOS) */}
      <div
        className="mural-vibes-secao"
        style={{
          gridColumn: '1 / -1',
          background: 'var(--cinza-card)',
          padding: '20px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          marginBottom: '10px',
        }}
      >
        {/* 1. BARRA HORIZONTAL DE BOLINHAS DINÂMICAS */}
        <div
          className="stories-container"
          id="container-stories-realtime"
          style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            paddingBottom: '8px',
            alignItems: 'center',
          }}
        >
          {/* Botão Principal de Adicionar (Abre o seletor de vibe) */}
          <div
            className="circle-story btn-abrir-seletor shrink-0"
            title="Compartilhar uma Vibe de 24h"
            onClick={() => setPainelVibeAberto((prev) => !prev)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '2px dashed var(--ciano-neon)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '1.3rem',
              background: 'var(--cinza-input)',
              cursor: 'pointer',
              color: 'var(--ciano-neon)',
              transition: 'all 0.2s ease',
              filter: 'drop-shadow(0 0 4px rgba(0, 240, 255, 0.25))',
            }}
          >
            <i className="fas fa-plus"></i>
          </div>

          {/* Stories Ativos dos Usuários */}
          {activeStories.length === 0 ? (
            <span
              id="txt-sem-vibes"
              style={{
                fontSize: '0.82rem',
                color: 'var(--texto-suave)',
                fontStyle: 'italic',
                marginLeft: '6px',
              }}
            >
              Nenhuma vibe na comu hoje...
            </span>
          ) : (
            activeStories.map((story) => {
              const comuInfo = comunidadesDisponiveis.find((c) => c.id === story.comunidade_id);
              const nomeExibicao = story.autor_nome || story.comunidade_nome || comuInfo?.nome || 'Membro';

              return (
                <div
                  key={story.id}
                  className="circle-story shrink-0 cursor-pointer flex flex-col items-center group relative"
                  onClick={() => setStoryVisualizando(story)}
                  title={`Ver vibe de ${nomeExibicao} (expira em 24h)`}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      padding: '2px',
                      background: 'linear-gradient(135deg, var(--ciano-neon) 0%, var(--pink-magenta) 50%, #FFD700 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(0, 240, 255, 0.25)',
                    }}
                    className="group-hover:scale-105 transition-transform"
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: 'var(--cinza-input)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {story.media_url ? (
                        <img src={story.media_url} alt={nomeExibicao} className="w-full h-full object-cover" />
                      ) : story.tipo === 'musica' ? (
                        <span className="text-xl">🎵</span>
                      ) : story.tipo === 'texto' ? (
                        <span className="text-xl">✍️</span>
                      ) : (
                        <span className="text-xl">{comuInfo?.emoji || '🪐'}</span>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--branco)',
                      marginTop: '4px',
                      maxWidth: '65px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {nomeExibicao.split(' ')[0]}
                  </span>
                </div>
              );
            })
          )}

          {/* Bolinhas das Tribos Disponíveis (Atalhos Compactos com Emojis) */}
          {comunidadesDisponiveis.map((comu) => (
            <div
              key={comu.id}
              className="circle-story shrink-0 cursor-pointer flex flex-col items-center group opacity-85 hover:opacity-100"
              onClick={() => {
                if (onOpenCommunity) {
                  onOpenCommunity(comu.id);
                } else {
                  onNavigateToCommunities();
                }
              }}
              title={`Abrir Tribo ${comu.nome}`}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  background: 'var(--cinza-input)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                }}
                className="group-hover:scale-105 transition-transform"
              >
                {comu.emoji}
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--texto-suave)',
                  marginTop: '4px',
                  maxWidth: '60px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                {comu.nome}
              </span>
            </div>
          ))}
        </div>

        {/* 2. PAINEL DE CONTROLE DE POSTAGEM (FLEXÍVEL: FOTO, TEXTO OU TRILHA) */}
        {painelVibeAberto && (
          <div
            className="painel-criar-vibe"
            id="painel-vibe-abas"
            style={{
              marginTop: '15px',
              paddingTop: '15px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--texto-suave)' }}>
                Escolha como expressar sua vibe de hoje:
              </p>

              {/* Seletor de Tribo */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--texto-suave)]">Tribo:</span>
                <select
                  value={comunidadeStoryId}
                  onChange={(e) => setComunidadeStoryId(e.target.value)}
                  style={{
                    background: 'var(--cinza-input)',
                    color: 'var(--branco)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                  }}
                  className="focus:outline-hidden focus:border-[var(--ciano-neon)] cursor-pointer"
                >
                  <option value="geral">🪐 Geral (Feed Aberto)</option>
                  {comunidadesDisponiveis.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Abas Seletoras de Mídia */}
            <div className="abas-botoes" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn-aba-tipo ${tipoVibe === 'foto' ? 'ativo' : ''}`}
                data-tipo="foto"
                onClick={() => {
                  setTipoVibe('foto');
                  fileVibeInputRef.current?.click();
                }}
                style={{
                  background: 'var(--cinza-input)',
                  color: 'var(--branco)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className="fas fa-camera" style={{ color: 'var(--ciano-neon)' }}></i> Câmera/Galeria
              </button>

              <button
                type="button"
                className={`btn-aba-tipo ${tipoVibe === 'texto' ? 'ativo' : ''}`}
                data-tipo="texto"
                onClick={() => setTipoVibe('texto')}
                style={{
                  background: 'var(--cinza-input)',
                  color: 'var(--branco)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className="fas fa-font" style={{ color: 'var(--pink-magenta)' }}></i> Texto Neon
              </button>

              <button
                type="button"
                className={`btn-aba-tipo ${tipoVibe === 'musica' ? 'ativo' : ''}`}
                data-tipo="musica"
                onClick={() => setTipoVibe('musica')}
                style={{
                  background: 'var(--cinza-input)',
                  color: 'var(--branco)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className="fas fa-music" style={{ color: '#FFD700' }}></i> Trilha Sonora
              </button>
            </div>

            {/* Input Dinâmico de Captura (Controlado via JS) */}
            <div className="container-input-dinamico flex flex-col gap-2.5">
              {/* Caso Foto: Input de Arquivo Real oculto que abre a câmera do celular */}
              <input
                type="file"
                id="file-vibe-upload"
                ref={fileVibeInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {/* Preview se foto selecionada */}
              {tipoVibe === 'foto' && vibeFotoPreview && (
                <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-[var(--ciano-neon)] shadow-md">
                  <img src={vibeFotoPreview} alt="Preview Foto" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setVibeFotoPreview('');
                      setInputVibeDado('');
                    }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Caso Texto ou Música: Caixa de Digitação Sutil */}
              <input
                type="text"
                id="input-vibe-dado"
                className="input-config"
                value={inputVibeDado}
                onChange={(e) => setInputVibeDado(e.target.value)}
                placeholder={
                  tipoVibe === 'foto'
                    ? (vibeFotoPreview ? 'Foto selecionada! Adicione uma legenda opcional ou lance no mural...' : 'Clique em Câmera/Galeria ou cole um link de imagem (https://...)')
                    : tipoVibe === 'texto'
                    ? 'Digite sua vibe em texto neon para o mural...'
                    : 'Qual música ou artista está tocando? (Ex: Evanescence - Bring Me To Life 🎧)'
                }
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--cinza-input)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  color: 'var(--branco)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Mensagem de Feedback */}
            {vibeFeedbackMsg && (
              <div
                style={{
                  fontSize: '0.85rem',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: vibeFeedbackMsg.includes('sucesso') ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 0, 127, 0.1)',
                  color: vibeFeedbackMsg.includes('sucesso') ? 'var(--ciano-neon)' : 'var(--pink-magenta)',
                  border: `1px solid ${vibeFeedbackMsg.includes('sucesso') ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 0, 127, 0.3)'}`,
                  fontWeight: 600,
                }}
              >
                {vibeFeedbackMsg}
              </div>
            )}

            <button
              type="button"
              className="btn-primario"
              id="btn-disparar-vibe"
              onClick={handleDispararVibe}
              disabled={isPostandoStory}
              style={{ alignSelf: 'flex-end', padding: '8px 24px' }}
            >
              {isPostandoStory ? 'Lançando...' : 'Lançar no Mural'}
            </button>
          </div>
        )}
      </div>

      {/* 👤 COLUNA ESQUERDA: PERFIL (ORKUT) */}
      <aside className="coluna-esquerda-vibe">
        <div className="box-vibe perfil-resumo-card">
          <div
            className="perfil-avatar cursor-pointer group"
            onClick={onNavigateToProfile}
            title="Ir para o Perfil Completo"
          >
            <img src={user.avatar} alt={user.name} />
          </div>
          <h2
            onClick={onNavigateToProfile}
            className="text-lg font-black text-[#4A4A4A] cursor-pointer hover:text-[#FF1493] transition-colors"
          >
            {user.name}
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#888' }}>"Em órbita..."</p>

          <div className="termometros-mini">
            <div>
              🧊 Confiável (85%){' '}
              <div className="barra-mini">
                <div className="barra-preenchida azul" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              ❤️ Legal (95%){' '}
              <div className="barra-mini">
                <div className="barra-preenchida rosa" style={{ width: '95%' }}></div>
              </div>
            </div>
            <div>
              🌟 Vibe (100%){' '}
              <div className="barra-mini">
                <div className="barra-preenchida roxo" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToProfile}
            className="w-full mt-2 py-2 px-3 bg-[#FFF0F5] hover:bg-[#FF1493] text-[#FF1493] hover:text-white rounded-xl text-xs font-bold border border-[#FF69B4]/30 transition-all cursor-pointer shadow-xs"
          >
            Ver Meu Perfil Completo 👤
          </button>
        </div>
      </aside>

      {/* 💬 COLUNA CENTRAL: FEED E MICRO-SCRAPS (X / TWITTER) */}
      <main className="coluna-feed">
        {/* CAIXA DE POSTAR MICRO-VIBE */}
        <div className="card card-postar">
          <div className="postar-topo">
            <img
              src={user.avatar}
              alt="Seu Avatar"
              className="avatar-p cursor-pointer"
              onClick={onNavigateToProfile}
            />
            <textarea
              placeholder="Qual é o seu micro-vibe de hoje? ✨"
              id="input-vibe"
              value={novoVibeTexto}
              onChange={(e) => setNovoVibeTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostar();
                }
              }}
            />
          </div>
          <div className="postar-acoes">
            <div className="botoes-midia">
              <button
                className="btn-midia"
                title="Adicionar Imagem"
                onClick={() => {
                  const url = prompt('Insira o link da foto para o feed:');
                  if (url) {
                    const novoPost: FeedPost = {
                      id: `p_${Date.now()}`,
                      autorNome: user.name,
                      autorHandle: `@${user.handle}`,
                      autorAvatar: user.avatar,
                      tempo: 'Agora mesmo',
                      texto: novoVibeTexto.trim() || 'Nova foto adicionada ao feed! 📸✨',
                      imagem: url,
                      curtidas: 1,
                      comentarios: 0,
                      curtido: true,
                    };
                    setPosts([novoPost, ...posts]);
                    setNovoVibeTexto('');
                  }
                }}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Foto
              </button>
              <button
                className="btn-midia"
                title="Adicionar Música/Link"
                onClick={() => alert('Trilha sonora do momento adicionada!')}
              >
                <Music className="w-3.5 h-3.5" /> Trilha
              </button>
            </div>
            <button className="btn-primario" id="btn-postar" onClick={handlePostar}>
              Postar
            </button>
          </div>
        </div>

        {/* LISTA DE CARDS DO FEED */}
        <div className="feed-lista">
          {posts.map((post) => (
            <div key={post.id} className="card card-vibe card-feed" data-id={post.id}>
              <div className="feed-header">
                <div className="usuario-info">
                  <img
                    src={post.autorAvatar}
                    alt={post.autorNome}
                    className="avatar-m link-perfil"
                    style={{ cursor: 'pointer' }}
                    onClick={onNavigateToProfile}
                  />
                  <div>
                    <h4
                      className="link-perfil cursor-pointer hover:text-[#FF1493] transition-colors"
                      onClick={onNavigateToProfile}
                    >
                      {post.autorNome}
                    </h4>
                    <span>
                      {post.autorHandle} • {post.tempo}
                    </span>
                  </div>
                </div>
                <button className="btn-opcoes" title="Opções">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <div className="feed-conteudo">
                <p>{post.texto}</p>
                {post.imagem && (
                  <div className="feed-midia">
                    <img src={post.imagem} alt="Mídia do feed" />
                  </div>
                )}
              </div>

              <div className="feed-footer">
                <button
                  className={`acao-feed btn-curtir ${post.curtido ? 'curtido' : ''}`}
                  onClick={() => handleToggleCurtida(post.id)}
                >
                  <Heart className={`w-4 h-4 ${post.curtido ? 'fill-[#FF1493]' : ''}`} />
                  <span className="contagem-curtidas">{post.curtidas}</span>
                </button>
                <button
                  className={`acao-feed ${postComentariosAberto === post.id ? 'text-[#00F0FF]' : ''}`}
                  onClick={() => handleToggleGavetaComentarios(post.id)}
                  title="Ver e responder comentários"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comentarios}</span>
                </button>
                <button
                  className="acao-feed"
                  onClick={() => alert('Link do post copiado!')}
                  title="Compartilhar"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* 💬 GAVETA DE COMENTÁRIOS DO FEED (REALTIME) */}
              {postComentariosAberto === post.id && (
                <div 
                  className="mt-3 pt-3 border-t border-white/10"
                  style={{ background: 'rgba(18, 18, 20, 0.6)', borderRadius: '10px', padding: '12px' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#00F0FF] uppercase tracking-wider flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-[#FF007F]" />
                      Respostas em Tempo Real ({comentariosDoPostAtual.length})
                    </span>
                    <button
                      onClick={() => setPostComentariosAberto(null)}
                      className="text-[11px] text-gray-400 hover:text-white cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>

                  {/* Lista de Respostas */}
                  <div className="max-h-[160px] overflow-y-auto space-y-2 mb-3 pr-1">
                    {comentariosDoPostAtual.length === 0 ? (
                      <div className="text-xs text-gray-400 italic py-2 text-center">
                        Nenhum comentário ainda. Deixe a primeira resposta! 💬
                      </div>
                    ) : (
                      comentariosDoPostAtual.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            background: '#1E1E24',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            borderLeft: '3px solid #FF007F',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <strong style={{ color: '#00F0FF', fontSize: '0.82rem' }}>
                              {c.autor_name || 'Membro da Tribo'}
                            </strong>
                            <span style={{ fontSize: '0.68rem', color: '#9AA0A6' }}>
                              {c.data_envio ? new Date(c.data_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.88rem', color: '#FFF', marginTop: '3px', wordBreak: 'break-word' }}>
                            {c.conteudo_texto}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Formulário de Envio */}
                  <form 
                    onSubmit={(e) => handleEnviarComentarioDoFeed(e, post.id)} 
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={textoNovoComentarioPost}
                      onChange={(e) => setTextoNovoComentarioPost(e.target.value)}
                      placeholder="Responder a este post..."
                      style={{
                        background: '#1E1E24',
                        color: '#FFF',
                        fontSize: '0.85rem',
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#00F0FF]"
                    />
                    <button
                      type="submit"
                      disabled={!textoNovoComentarioPost.trim() || enviandoComentarioPost}
                      className="px-3.5 py-1.5 rounded-lg font-bold text-xs text-white transition-transform hover:scale-105 disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, #FF007F 0%, #9400D3 50%, #00F0FF 100%)',
                      }}
                    >
                      {enviandoComentarioPost ? 'Enviando...' : 'Comentar'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* COLUNA DA DIREITA: EVENTOS E RECOMENDAÇÕES */}
      <aside className="coluna-direita">
        {/* Bloco de Eventos */}
        <div className="card card-eventos">
          <div className="eventos-header">
            <h3>
              <Calendar className="w-4 h-4" /> Próximos Eventos
            </h3>
            <a
              href="#eventos"
              onClick={(e) => {
                e.preventDefault();
                alert('Mostrando todos os eventos da comunidade!');
              }}
              className="link-ver-todos"
            >
              Ver todos
            </a>
          </div>
          <div className="eventos-lista">
            {/* Evento 1 */}
            <div className="evento-item">
              <div className="evento-data">
                <span className="mes">OUT</span>
                <span className="dia">12</span>
              </div>
              <div className="evento-detalhes">
                <h4>Expedição Arqueológica</h4>
                <p>
                  <MapPin className="w-3 h-3 text-[#00BFFF]" /> Vale dos Reis, Egito
                </p>
                <span className="confirmados">32 amigos vão</span>
              </div>
            </div>
            {/* Evento 2 */}
            <div className="evento-item">
              <div className="evento-data">
                <span className="mes">NOV</span>
                <span className="dia">05</span>
              </div>
              <div className="evento-detalhes">
                <h4>Workshop: Sobrevivência</h4>
                <p>
                  <Video className="w-3 h-3 text-[#FF1493]" /> Transmissão Online
                </p>
                <span className="confirmados">150 participantes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco Sugestões de Conexões */}
        <div className="card card-sugestoes">
          <h3>Pessoas que você talvez conheça</h3>
          <div className="sugestoes-lista">
            <div className="sugestao-item">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
                alt="Elena Fisher"
                className="avatar-s"
              />
              <div className="sugestao-info">
                <h4>Elena Fisher</h4>
                <span>@elena_reporter</span>
              </div>
              <button
                className="btn-adicionar"
                title="Adicionar amigo"
                onClick={() => alert('Convite de amizade enviado para Elena Fisher!')}
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="sugestao-item">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                alt="Victor Sullivan"
                className="avatar-s"
              />
              <div className="sugestao-info">
                <h4>Sully</h4>
                <span>@sully_pilot</span>
              </div>
              <button
                className="btn-adicionar"
                title="Adicionar amigo"
                onClick={() => alert('Convite de amizade enviado para Sully!')}
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 🚀 MODAL: POSTAR STORY NA TRIBO (TEMPO REAL) */}
      {modalNovoStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#FF69B4]/30 relative">
            <button
              type="button"
              onClick={() => setModalNovoStory(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 text-[#FF1493]">
              <Sparkles className="w-6 h-6" />
              <h3 className="text-lg font-black tracking-tight">Lançar Story na Tribo</h3>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Compartilhe uma imagem ou vibe temporária com sua comunidade. Ela ficará visível no topo do feed por <strong className="text-[#FF1493]">24 horas exatas</strong>.
            </p>

            <form onSubmit={handleLancarStory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  1. Escolha a Tribo / Comunidade:
                </label>
                <select
                  value={comunidadeStoryId}
                  onChange={(e) => setComunidadeStoryId(e.target.value)}
                  className="w-full text-sm py-2.5 px-3 rounded-xl border border-gray-200 bg-[#FAFAFA] font-semibold text-gray-700 focus:outline-hidden focus:border-[#FF1493]"
                >
                  {comunidadesDisponiveis.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  2. Foto do Story (Galeria ou Câmera / Selfie):
                </label>

                {/* Inputs ocultos para Galeria e Câmera */}
                <input
                  type="file"
                  id="react-story-galeria"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const compressed = await fazerUploadDeFoto(file);
                        setMediaStoryUrl(compressed);
                      } catch (err) {
                        console.error('Erro ao comprimir foto:', err);
                      }
                    }
                  }}
                />
                <input
                  type="file"
                  id="react-story-camera"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const compressed = await fazerUploadDeFoto(file);
                        setMediaStoryUrl(compressed);
                      } catch (err) {
                        console.error('Erro ao comprimir foto da câmera:', err);
                      }
                    }
                  }}
                />

                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById('react-story-galeria')?.click()}
                    className="flex-1 py-2 px-3 rounded-xl border border-[#00F0FF]/50 bg-[#00F0FF]/10 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#00F0FF]/20 cursor-pointer transition-transform hover:scale-102"
                  >
                    📁 Galeria (Celular / PC)
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('react-story-camera')?.click()}
                    className="flex-1 py-2 px-3 rounded-xl border border-[#FF007F]/50 bg-[#FF007F]/10 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#FF007F]/20 cursor-pointer transition-transform hover:scale-102"
                  >
                    📸 Câmera / Selfie
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  {presetsImagens.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setMediaStoryUrl(p.url)}
                      className={`text-xs p-2 rounded-xl border font-bold flex items-center gap-2 transition-all text-left ${
                        mediaStoryUrl === p.url
                          ? 'border-[#FF1493] bg-[#FFF0F5] text-[#FF1493] shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-[#FAFAFA]'
                      }`}
                    >
                      <img src={p.url} alt={p.label} className="w-7 h-7 rounded-lg object-cover" />
                      <span className="truncate">{p.label}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="url"
                  value={mediaStoryUrl}
                  onChange={(e) => setMediaStoryUrl(e.target.value)}
                  placeholder="Ou cole a URL da sua imagem (https://...)"
                  className="w-full text-xs py-2 px-3 rounded-xl border border-gray-200 bg-[#FAFAFA] focus:outline-hidden focus:border-[#FF1493]"
                />
              </div>

              {/* Preview */}
              {(mediaStoryUrl || presetsImagens[0].url) && (
                <div className="relative rounded-2xl overflow-hidden h-40 bg-black flex items-center justify-center border border-gray-200 shadow-inner">
                  <img
                    src={mediaStoryUrl || presetsImagens[0].url}
                    alt="Preview Story"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#FF1493]" />
                    Expira em 24h
                  </div>
                </div>
              )}

              {storyMsg && (
                <div className="p-2.5 rounded-xl text-xs font-bold text-center bg-[#FFF0F5] text-[#FF1493] border border-[#FF69B4]/30 animate-pulse">
                  {storyMsg}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoStory(false)}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPostandoStory}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#FF1493] via-[#9400D3] to-[#00BFFF] text-white text-xs font-black shadow-md hover:scale-102 transition-transform disabled:opacity-50"
                >
                  {isPostandoStory ? 'Lançando...' : 'Lançar Story (24h)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📺 MODAL: VISUALIZADOR DE STORY (ESTILO INSTAGRAM / Y2K) */}
      {storyVisualizando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setStoryVisualizando(null)}
        >
          <div
            className="relative max-w-sm w-full bg-[#111] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* BARRA DE PROGRESSO ANIMADA (5 SEGUNDOS) */}
            <div className="absolute top-2 left-3 right-3 z-20 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#FF1493] to-[#00BFFF] animate-[progressoStory_5s_linear_forwards]"></div>
            </div>

            {/* HEADER DO STORY */}
            <div className="absolute top-5 left-3 right-3 z-20 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-[var(--ciano-neon)] bg-[var(--cinza-input)] flex items-center justify-center text-sm shadow-sm overflow-hidden">
                  {storyVisualizando.autor_avatar ? (
                    <img src={storyVisualizando.autor_avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{comunidadesDisponiveis.find((c) => c.id === storyVisualizando.comunidade_id)?.emoji || '🪐'}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black drop-shadow-md text-white">
                    {storyVisualizando.autor_nome || 'Membro da Tribo'}
                  </h4>
                  <span className="text-[10px] text-[var(--ciano-neon)] drop-shadow-xs flex items-center gap-1 font-semibold">
                    <Clock className="w-2.5 h-2.5 text-[#FF1493]" />
                    {comunidadesDisponiveis.find((c) => c.id === storyVisualizando.comunidade_id)?.nome || storyVisualizando.comunidade_nome || 'Tribo Vibe'} • Ativo por 24h
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStoryVisualizando(null)}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MÍDIA / IMAGEM / TEXTO NEON / MÚSICA DO STORY */}
            <div className="w-full h-[320px] bg-black flex items-center justify-center overflow-hidden relative">
              {storyVisualizando.tipo === 'texto' || storyVisualizando.texto_vibe ? (
                <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#151221] via-[#0B0911] to-[#1F1C33]">
                  <span className="text-4xl mb-4 animate-bounce">✨</span>
                  <p className="text-xl md:text-2xl font-black bg-gradient-to-r from-[var(--pink-magenta)] via-[#9400D3] to-[var(--ciano-neon)] bg-clip-text text-transparent drop-shadow-lg leading-relaxed max-w-sm">
                    "{storyVisualizando.texto_vibe || 'Vibe em Neon'}"
                  </p>
                  <span className="mt-4 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold bg-white/5 text-[var(--ciano-neon)] border border-white/10">
                    Vibe Neon 24h
                  </span>
                </div>
              ) : storyVisualizando.tipo === 'musica' || storyVisualizando.trilha_musica ? (
                <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#151221] via-[#0B0911] to-[#1F1C33]">
                  <div className="w-24 h-24 rounded-full border-2 border-[#FFD700] bg-black/80 flex items-center justify-center text-4xl mb-4 shadow-[0_0_25px_rgba(255,215,0,0.35)] animate-spin" style={{ animationDuration: '6s' }}>
                    💿
                  </div>
                  <span className="text-xs uppercase tracking-widest text-[#FFD700] font-black flex items-center gap-1.5">
                    <i className="fas fa-music text-[#FFD700]"></i> Trilha Sonora do Momento
                  </span>
                  <p className="text-lg md:text-xl font-black text-white mt-2 max-w-sm drop-shadow-md">
                    {storyVisualizando.trilha_musica || 'Trilha Sem Título'}
                  </p>
                </div>
              ) : storyVisualizando.media_url ? (
                <img
                  src={storyVisualizando.media_url}
                  alt="Story da Tribo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6">
                  <span className="text-6xl mb-3 block">🪐</span>
                  <p className="text-white font-bold text-sm">Vibe compartilhada na comunidade</p>
                </div>
              )}
            </div>

            {/* 💬 ÁREA DE COMENTÁRIOS DA VIBE (PALETA OFICIAL DE ALTO IMPACTO) */}
            <div className="bg-[#121214] p-3 border-t border-white/10 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#00F0FF] uppercase tracking-wider flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-[#FF007F]" />
                  Comentários na Vibe ({comentariosStory.length})
                </span>
                <span className="text-[10px] text-gray-400">Tempo real</span>
              </div>

              {/* LISTA DE COMENTÁRIOS (.modal-comentarios-area) */}
              <div className="modal-comentarios-area max-h-[140px] overflow-y-auto pr-1 space-y-2 mb-2">
                {comentariosStory.length === 0 ? (
                  <div className="text-center text-xs text-[#9AA0A6] py-3 italic">
                    Nenhum comentário nesta Vibe ainda. Seja o primeiro a comentar! ✨
                  </div>
                ) : (
                  comentariosStory.map((com) => (
                    <div
                      key={com.id}
                      style={{
                        background: '#1E1E24',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        borderLeft: '3px solid #FF007F',
                      }}
                    >
                      <strong style={{ color: '#00F0FF', fontSize: '0.82rem' }}>
                        {com.autor_name || 'Membro da Tribo'}
                      </strong>
                      <p style={{ fontSize: '0.88rem', color: '#FFF', marginTop: '2px', wordBreak: 'break-word' }}>
                        {com.conteudo_texto}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* FORMULÁRIO DE COMENTÁRIO */}
              <form onSubmit={handleEnviarComentarioStory} className="flex gap-2">
                <input
                  type="text"
                  value={novoComentarioStory}
                  onChange={(e) => setNovoComentarioStory(e.target.value)}
                  placeholder="Comente nesta Vibe..."
                  style={{
                    background: '#1E1E24',
                    color: '#FFF',
                    fontSize: '0.85rem',
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#00F0FF]"
                />
                <button
                  type="submit"
                  disabled={!novoComentarioStory.trim() || enviandoComentario}
                  className="px-3 py-1.5 rounded-lg font-bold text-xs text-white transition-transform hover:scale-105 disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #FF007F 0%, #9400D3 50%, #00F0FF 100%)',
                  }}
                  title="Enviar comentário"
                >
                  Enviar
                </button>
              </form>
            </div>

            {/* FOOTER DO STORY */}
            <div className="p-3 bg-black flex items-center justify-between border-t border-white/5">
              <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#FF007F]" />
                Expira em 24h
              </span>
              <button
                type="button"
                onClick={() => {
                  alert('Vibe enviada com sucesso no Story! 💖');
                }}
                className="px-3.5 py-1 rounded-full bg-[#FF007F] hover:bg-[#FF1493] text-white text-xs font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                Mandar Vibe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
