import React, { useState } from 'react';
import { X, Snowflake, Heart, Flame, Sparkles, CheckCircle2 } from 'lucide-react';

interface VoteModalProps {
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onVote: (type: 'trustworthy' | 'cool' | 'sexy') => void;
}

export const VoteModal: React.FC<VoteModalProps> = ({
  userName,
  isOpen,
  onClose,
  onVote,
}) => {
  const [votedType, setVotedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCastVote = (type: 'trustworthy' | 'cool' | 'sexy') => {
    onVote(type);
    setVotedType(type);
    setTimeout(() => {
      setVotedType(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-[#FF69B4]/30 relative animate-in fade-in zoom-in duration-200">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FFF0F5] border-2 border-[#FF69B4]/30 flex items-center justify-center text-2xl mb-2">
            ✨
          </div>
          <h3 className="text-lg font-black text-[#FF1493] font-['Space_Grotesk']">
            Avaliar a Vibe de {userName}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Seja sincero(a)! Sua avaliação alimenta os medidores clássicos do OrkuVibe.
          </p>
        </div>

        {votedType ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
            <p className="text-sm font-bold text-[#4A4A4A]">Voto computado com sucesso!</p>
            <p className="text-xs text-[#FF1493] font-semibold">Os medidores aumentaram 📈✨</p>
          </div>
        ) : (
          <div className="space-y-3">
            
            {/* Opção 1: Confiável */}
            <button
              onClick={() => handleCastVote('trustworthy')}
              className="w-full p-3.5 rounded-2xl bg-[#F0F8FF] hover:bg-[#E0F2FE] border border-[#00BFFF]/30 flex items-center justify-between text-left transition-all hover:scale-102 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#00BFFF] shadow-xs">
                  <Snowflake className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#0088cc]">Super Confiável 🧊</h4>
                  <p className="text-[11px] text-gray-500">Nunca dá ghosting, responde rápido</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#00BFFF] opacity-0 group-hover:opacity-100 transition-opacity">
                +1
              </span>
            </button>

            {/* Opção 2: Legal */}
            <button
              onClick={() => handleCastVote('cool')}
              className="w-full p-3.5 rounded-2xl bg-[#FFF0F5] hover:bg-[#FFE4E6] border border-[#FF69B4]/30 flex items-center justify-between text-left transition-all hover:scale-102 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#FF1493] shadow-xs">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#FF1493]">Muito Legal 💖</h4>
                  <p className="text-[11px] text-gray-500">Vibe boa, manda os melhores memes</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#FF1493] opacity-0 group-hover:opacity-100 transition-opacity">
                +1
              </span>
            </button>

            {/* Opção 3: Ícone / Sexy */}
            <button
              onClick={() => handleCastVote('sexy')}
              className="w-full p-3.5 rounded-2xl bg-[#FFF8F0] hover:bg-[#FEF3C7] border border-amber-300/40 flex items-center justify-between text-left transition-all hover:scale-102 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-xs">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-600">Ícone Estético 🔥</h4>
                  <p className="text-[11px] text-gray-500">Looks impecáveis, estética Y2K pura</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                +1
              </span>
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
