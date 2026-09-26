import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertTriangle, MessageCircle, ArrowLeft, Check, Sparkles, Smile, Volume2, Wifi, Moon, Sun } from 'lucide-react';
import { UserProfile } from '../types';
import { enviarMensagemPrivada, escutarChatEmTempoReal } from '../services/firebase-chat';

export interface ChatMessage {
  id: string;
  sender: 'me' | 'other' | 'system';
  text: string;
  time: string;
  isNudge?: boolean;
}

export interface ChatConversation {
  id: string;
  name: string;
  avatarIcon: string;
  avatarBg?: string;
  time: string;
  preview: string;
  online: boolean;
  status: string;
  messages: ChatMessage[];
}

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'c1',
    name: 'Lucas Skate',
    avatarIcon: '🛹',
    time: '10:42',
    preview: 'Bora testar a pista nova hoje?',
    online: true,
    status: '🛹 dropando na pista da Praça Roosevelt',
    messages: [
      {
        id: 'm1',
        sender: 'other',
        text: 'E aí, beleza? Tá sabendo do corujão de Bomba Patch na comu? ⚽',
        time: '10:35',
      },
      {
        id: 'm2',
        sender: 'me',
        text: 'Opa Lucas! Com certeza, já garanti meu lugar no sofá virtual haha 🎮',
        time: '10:38',
      },
      {
        id: 'm3',
        sender: 'other',
        text: 'Bora testar a pista nova hoje?',
        time: '10:42',
      },
    ],
  },
  {
    id: 'c2',
    name: 'Marina Retro',
    avatarIcon: '👩‍🎨',
    time: 'Ontem',
    preview: 'Você viu o novo modelo da logo?',
    online: false,
    status: '🎨 editando fotos no Photoshop 7.0',
    messages: [
      {
        id: 'm21',
        sender: 'other',
        text: 'Oi Lara! Ficou linda demais a nova arte do Tribbu\'sVibe!',
        time: 'Ontem 18:20',
      },
      {
        id: 'm22',
        sender: 'other',
        text: 'Você viu o novo modelo da logo?',
        time: 'Ontem 18:22',
      },
      {
        id: 'm23',
        sender: 'me',
        text: 'Vi sim Mari! O degradê neon e os avatares ficaram perfeitos ✨',
        time: 'Ontem 18:30',
      },
    ],
  },
  {
    id: 'c3',
    name: 'Pedro Sampaio (Y2K)',
    avatarIcon: '🎧',
    time: 'Ontem',
    preview: 'Mandei mais scraps na sua página!',
    online: true,
    status: '💿 gravando CD virgem de MP3',
    messages: [
      {
        id: 'm31',
        sender: 'other',
        text: 'Passando pra avisar que te adicionei no meu Top 8 de amigos!',
        time: 'Ontem 15:10',
      },
      {
        id: 'm32',
        sender: 'other',
        text: 'Mandei mais scraps na sua página!',
        time: 'Ontem 15:12',
      },
    ],
  },
  {
    id: 'c4',
    name: 'Aline Indie',
    avatarIcon: '👾',
    time: '12/09',
    preview: 'Amei a playlist do seu perfil!',
    online: false,
    status: '🎧 ouvindo The Strokes no Winamp',
    messages: [
      {
        id: 'm41',
        sender: 'other',
        text: 'Amei a playlist do seu perfil! Qual é o nome daquela terceira faixa?',
        time: '12/09 21:04',
      },
    ],
  },
];

interface MessagesViewProps {
  user: UserProfile;
  onNavigateToTab: (tab: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ user, onNavigateToTab }) => {
  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('c1');
  const [inputText, setInputText] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState<string | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myUid = user.id || 'me-usuario-local';

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv.messages, isShaking]);

  // Sincronização em tempo real do chat no Firestore
  useEffect(() => {
    const amigoId = activeConv.id;
    let isMounted = true;

    // Escuta em tempo real usando o método modular escutarChatEmTempoReal
    const cancelarInscricao = escutarChatEmTempoReal(myUid, amigoId, (mensagensFirebase) => {
      if (!isMounted || !mensagensFirebase || mensagensFirebase.length === 0) return;

      setIsFirebaseConnected(true);

      // Converte as mensagens do Firestore para o formato visual ChatMessage
      const msgsFormatadas: ChatMessage[] = mensagensFirebase.map((docMsg: any) => {
        const isMe = docMsg.remetente_id === myUid;
        let timeFormatted = '';
        try {
          if (docMsg.data_envio) {
            const dateObj = new Date(docMsg.data_envio);
            timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
        } catch {
          timeFormatted = 'agora';
        }

        if (docMsg.is_atencao) {
          return {
            id: docMsg.id,
            sender: 'system',
            text: isMe
              ? `⚠️ Você acabou de chamar a atenção de ${activeConv.name}! 📳`
              : `⚠️ ${activeConv.name} chamou sua atenção! 📳`,
            time: timeFormatted,
            isNudge: true,
          };
        }

        return {
          id: docMsg.id,
          sender: isMe ? 'me' : 'other',
          text: docMsg.conteudo_texto,
          time: timeFormatted,
        };
      });

      // Se a última mensagem recebida for um Nudge de outra pessoa, ativa o tremor na tela!
      const lastMsg = mensagensFirebase[mensagensFirebase.length - 1];
      if (lastMsg && lastMsg.is_atencao && lastMsg.remetente_id !== myUid) {
        playNudgeSound();
        setIsShaking(true);
        setAudioFeedback(`💥 ${activeConv.name} chamou sua atenção!`);
        setTimeout(() => {
          setIsShaking(false);
          setAudioFeedback(null);
        }, 800);
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === amigoId) {
            // Mescla sem duplicar com base nos IDs
            const existingIds = new Set(msgsFormatadas.map((m) => m.id));
            const initialPreserved = c.messages.filter((m) => !existingIds.has(m.id) && !m.id.startsWith('m_fb_'));
            const merged = [...initialPreserved, ...msgsFormatadas];
            const ultMsg = msgsFormatadas[msgsFormatadas.length - 1];

            return {
              ...c,
              time: ultMsg?.time || c.time,
              preview: ultMsg?.text || c.preview,
              messages: merged,
            };
          }
          return c;
        })
      );
    });

    return () => {
      isMounted = false;
      if (typeof cancelarInscricao === 'function') {
        cancelarInscricao();
      }
    };
  }, [activeConv.id, myUid]);

  const playNudgeSound = () => {
    try {
      // Usar Web Audio API para tocar um efeito sonoro de sintetizador estilo MSN Nudge
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const now = ctx.currentTime;
      // Dois bipes fortes e característicos do alarme MSN
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(554, now + 0.22);
      osc2.frequency.exponentialRampToValueAtTime(1108, now + 0.4);
      gain2.gain.setValueAtTime(0.35, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.45);
    } catch {
      // Silencioso se bloqueado por autoplay do navegador
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: 'me',
      text,
      time: timeStr,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            time: timeStr,
            preview: text,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setInputText('');

    // Persiste no Firestore em tempo real através da coleção chats_privados
    enviarMensagemPrivada(myUid, activeConv.id, text, false).catch((err) => {
      console.warn('Sincronização em segundo plano:', err);
    });

    // Resposta simulada retrô caso o destinatário seja um contato do mock
    setTimeout(() => {
      const replies = [
        'Demais! Fechado então!',
        'Com certeza!! Vou te mandar o link da comunidade agora.',
        'Hahaha muito bom! Tribbu\'sVibe tá incrível demais 🚀',
        'Show de bola, nos falamos logo mais!',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConv.id) {
            return {
              ...c,
              time: replyTime,
              preview: randomReply,
              messages: [
                ...c.messages,
                {
                  id: `reply_${Date.now()}`,
                  sender: 'other',
                  text: randomReply,
                  time: replyTime,
                },
              ],
            };
          }
          return c;
        })
      );
    }, 1200);
  };

  // O LENDÁRIO BOTÃO DE CHAMAR ATENÇÃO (PITADA MSN)
  const handleNudge = () => {
    playNudgeSound();
    setIsShaking(true);
    setAudioFeedback('💥 Treme-tela ativado!');

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const nudgeMsg: ChatMessage = {
      id: `nudge_${Date.now()}`,
      sender: 'system',
      text: `⚠️ Você acabou de chamar a atenção de ${activeConv.name}! 📳`,
      time: timeStr,
      isNudge: true,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            time: timeStr,
            preview: `⚠️ Chamou atenção!`,
            messages: [...c.messages, nudgeMsg],
          };
        }
        return c;
      })
    );

    // Envia o comando de chamar atenção para o Firestore
    enviarMensagemPrivada(myUid, activeConv.id, `⚠️ Chamou a atenção de ${activeConv.name}!`, true).catch((err) => {
      console.warn('Erro ao disparar tremor no Firestore:', err);
    });

    // Remove a animação de sacudir a tela após 600ms
    setTimeout(() => {
      setIsShaking(false);
      setAudioFeedback(null);
    }, 600);

    // Resposta do amigo reagindo ao tremor
    setTimeout(() => {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConv.id) {
            return {
              ...c,
              time: replyTime,
              preview: 'Opa, tremeu tudo aqui kkkk! Tô aqui!',
              messages: [
                ...c.messages,
                {
                  id: `reply_nudge_${Date.now()}`,
                  sender: 'other',
                  text: 'Opa! Tremeu toda a minha janela aqui kkkk! 😂 Fala aí!',
                  time: replyTime,
                },
              ],
            };
          }
          return c;
        })
      );
    }, 1500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-5 flex flex-col h-[calc(100vh-80px)]">
      {/* Barra de título e atalho superior */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => onNavigateToTab('scraps')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF1493] hover:text-[#9400D3] bg-white px-3 py-1.5 rounded-full border border-[#FF69B4]/20 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para Meu Perfil</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <MessageCircle className="w-4 h-4 text-[#FF1493]" />
          <span>Mensagens Privadas &bull; Bate-papo Tribbu'sVibe</span>
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-emerald-300">
            <Wifi className="w-2.5 h-2.5 animate-pulse" />
            Tempo Real (Firestore)
          </span>
        </div>
      </div>

      {/* ÁREA DO CHAT UNIFICADO */}
      <div
        className={`chat-layout janela-chat flex flex-1 rounded-[24px] border shadow-[0_10px_30px_rgba(255,20,147,0.06)] overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-[#14141B] border-gray-800 shadow-[0_10px_30px_rgba(0,0,0,0.45)]'
            : 'bg-white border-[#FF69B4]/20'
        } ${isShaking ? 'anim-tremer-tela' : ''}`}
      >
        {/* 📱 COLUNA DA ESQUERDA: LISTA DE CONVERSAS (PITADA WHATSAPP) */}
        <aside
          className={`w-20 sm:w-[320px] md:w-[350px] border-r flex flex-col shrink-0 transition-colors ${
            isDarkMode ? 'bg-[#1A1A24] border-gray-800' : 'bg-[#FAFAFA] border-[#FFF0F5]'
          }`}
        >
          <div
            className={`p-4 sm:p-5 text-sm sm:text-base font-bold border-b text-[#FF1493] flex items-center justify-between ${
              isDarkMode ? 'border-gray-800' : 'border-[#FFF0F5]'
            }`}
          >
            <span className="hidden sm:inline">Conversas Privadas</span>
            <span className="sm:hidden mx-auto">💬</span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FF1493]/10 text-[#FF1493] font-extrabold">
              {conversations.length} ativas
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-500/10">
            {conversations.map((c) => {
              const isActive = c.id === activeConv.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`flex items-center gap-3 p-3 sm:p-4 cursor-pointer transition-colors ${
                    isActive
                      ? isDarkMode
                        ? 'bg-[#242436] border-l-4 border-[#FF1493]'
                        : 'bg-[#FFF0F5]'
                      : isDarkMode
                      ? 'hover:bg-[#20202E]'
                      : 'hover:bg-[#FFF0F5]/50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl border-2 border-[#FF1493] shadow-2xs ${
                        isDarkMode ? 'bg-[#252533]' : 'bg-white'
                      }`}
                    >
                      {c.avatarIcon}
                    </div>
                    {c.online && (
                      <span
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#1A1A24] rounded-full"
                        title="Online agora"
                      />
                    )}
                  </div>

                  <div className="conversa-info hidden sm:block flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4
                        className={`text-sm font-bold truncate ${
                          isDarkMode ? 'text-gray-100' : 'text-[#333]'
                        }`}
                      >
                        {c.name}
                      </h4>
                      <span className="text-[11px] text-gray-400">{c.time}</span>
                    </div>
                    <p
                      className={`text-xs truncate ${
                        isDarkMode ? 'text-gray-400' : 'text-[#777]'
                      }`}
                    >
                      {c.preview}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* 💬 COLUNA DA DIREITA: JANELA DO BATE-PAPO */}
        <main
          className={`flex-1 flex flex-col min-w-0 transition-colors ${
            isDarkMode ? 'bg-[#121218]' : 'bg-white'
          }`}
        >
          {/* HEADER DA JANELA */}
          <div
            className={`p-3.5 sm:p-4 border-b flex justify-between items-center backdrop-blur z-10 transition-colors ${
              isDarkMode
                ? 'bg-[#1A1A24]/90 border-gray-800'
                : 'bg-white/80 border-[#FFF0F5]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl border-2 border-[#FF1493] shrink-0 ${
                  isDarkMode ? 'bg-[#252533]' : 'bg-[#FFF0F5]'
                }`}
              >
                {activeConv.avatarIcon}
              </div>
              <div className="min-w-0">
                <strong
                  className={`block text-sm sm:text-base truncate ${
                    isDarkMode ? 'text-white' : 'text-[#333]'
                  }`}
                >
                  {activeConv.name}
                </strong>
                <span className="block text-[11px] text-gray-400 truncate">
                  {activeConv.status}
                </span>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO SUPERIOR */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Seletor Dark / Light Mode */}
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Dark Mode'}
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-[#22222E] border-gray-700 text-amber-300 hover:bg-[#2A2A38]'
                    : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* 🔊 O LENDÁRIO BOTÃO DE CHAMAR ATENÇÃO (PITADA MSN) */}
              <button
                type="button"
                onClick={handleNudge}
                title="Chamar Atenção! (Faz a tela de todos sacudir igual no MSN)"
                className="btn-atencao flex items-center gap-1.5 text-xs font-bold text-white px-3 sm:px-4 py-2 rounded-full cursor-pointer shadow-md hover:scale-105 transition-all bg-gradient-to-r from-[#FF1493] via-[#9400D3] to-[#00BFFF]"
              >
                <AlertTriangle className="w-4 h-4 text-amber-300 animate-pulse" />
                <span className="hidden sm:inline">Chamar Atenção</span>
                <span className="sm:hidden">Treme!</span>
              </button>
            </div>
          </div>

          {/* Feedback temporário de som / tremor */}
          {audioFeedback && (
            <div className="bg-amber-400 text-black text-xs font-bold px-3 py-1 text-center animate-bounce">
              {audioFeedback}
            </div>
          )}

          {/* ÁREA DE MENSAGENS */}
          <div
            className={`mensagens-area flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-3 transition-colors ${
              isDarkMode ? 'bg-[#0E0E14]' : 'bg-[#FCFCFC]'
            }`}
          >
            <div className="text-center my-2">
              <span
                className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
                  isDarkMode
                    ? 'text-gray-400 bg-gray-900 border border-gray-800'
                    : 'text-gray-400 bg-gray-100'
                }`}
              >
                🔒 Conversa protegida com ponta-a-ponta e nostalgia Y2K
              </span>
            </div>

            {activeConv.messages.map((m) => {
              if (m.isNudge || m.sender === 'system') {
                return (
                  <div
                    key={m.id}
                    className="balao atencao-msg anim-tremer-balao self-center max-w-[85%] sm:max-w-[70%] p-3 my-2 text-center rounded-xl bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 border border-[#FF1493] text-[#00BFFF] text-xs sm:text-sm font-bold shadow-lg"
                  >
                    {m.text}
                    <div className="text-[10px] text-gray-400 mt-1 font-normal">{m.time}</div>
                  </div>
                );
              }

              const isMe = m.sender === 'me';

              return (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[85%] sm:max-w-[65%] ${
                    isMe ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div
                    className={`balao ${isMe ? 'enviado' : 'recebido'} p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-[#FF1493] text-white rounded-tr-xs shadow-xs'
                        : isDarkMode
                        ? 'bg-[#20202C] text-gray-100 border border-gray-800 rounded-tl-xs shadow-2xs'
                        : 'bg-[#ECEFF1] text-[#333] rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{m.time}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* ENTRADA DE TEXTO DA MENSAGEM */}
          <form
            onSubmit={handleSend}
            className={`p-3 sm:p-4 border-t flex gap-2 sm:gap-3 items-center transition-colors ${
              isDarkMode ? 'bg-[#1A1A24] border-gray-800' : 'bg-white border-[#FFF0F5]'
            }`}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Escreva uma mensagem para ${activeConv.name}...`}
              className={`input-chat-texto flex-1 py-2.5 px-4 sm:px-5 border rounded-full text-xs sm:text-sm transition-colors focus:outline-hidden focus:border-[#00BFFF] ${
                isDarkMode
                  ? 'bg-[#22222E] border-gray-700 text-white placeholder:text-gray-500'
                  : 'bg-[#FAFAFA] border-[#EAEAEA] text-[#4A4A4A]'
              }`}
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`btn-enviar-chat w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shadow-md ${
                inputText.trim()
                  ? 'bg-[#00BFFF] hover:bg-[#009ACD] scale-100 hover:scale-105'
                  : 'bg-gray-400 opacity-50 cursor-not-allowed'
              }`}
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};
