import React from 'react';
import { useAppLogo } from '../utils/logo';

interface NotFoundViewProps {
  onBackToVibe: () => void;
}

export function NotFoundView({ onBackToVibe }: NotFoundViewProps) {
  const { logoSrc } = useAppLogo();

  return (
    <div className="w-full min-h-screen bg-[#FFF0F5] text-[#4A4A4A] flex flex-col justify-center items-center p-5 text-center font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif]">
      {/* Caixa Central do Erro 404 */}
      <div className="bg-white max-w-[550px] w-full p-8 sm:p-10 rounded-3xl shadow-[0_10px_30px_rgba(255,20,147,0.1)] border-2 border-[rgba(255,105,180,0.15)] flex flex-col items-center gap-5">
        
        {/* Marca Tribbu'sVibe */}
        <div className="mb-2 flex flex-col items-center">
          <img
            src="/tribbusvibe_transparent.png"
            alt="Tribbu'sVibe Logo"
            className="w-24 sm:w-28 h-auto aspect-square object-contain drop-shadow-xl select-none"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = '/tribbusvibe.png';
            }}
          />
        </div>

        {/* O Número do Erro com estilo Gel 3D */}
        <div className="text-7xl sm:text-8xl font-black font-['Arial_Black',_sans-serif] bg-gradient-to-br from-[#FF1493] to-[#9400D3] bg-clip-text text-transparent leading-none tracking-tighter">
          404
        </div>

        {/* Título de Erro */}
        <h2 className="text-xl sm:text-2xl text-[#4A4A4A] font-bold">
          Eita! Essa tribo sumiu no espaço... 🌌
        </h2>

        {/* Mensagem Explicativa */}
        <p className="text-base text-[#666] leading-relaxed">
          A página, o perfil ou a comunidade que você estava tentando acessar não foi encontrada na nossa órbita. Mas não esquenta a cabeça, respira fundo e volte para o feed na maior tranquilidade.
        </p>

        {/* Botão Arredondado para Voltar para a Segurança */}
        <button
          onClick={onBackToVibe}
          className="inline-block bg-[#FF1493] hover:bg-[#D1107A] text-white px-8 py-3.5 rounded-full font-bold text-base transition-all transform hover:scale-105 active:scale-95 mt-2 shadow-[0_4px_15px_rgba(255,20,147,0.25)] cursor-pointer"
        >
          Voltar para a minha Vibe
        </button>
      </div>

      {/* Rodapé sutil */}
      <footer className="mt-8 text-xs sm:text-sm text-[#999]">
        Nenhum algoritmo quebrou essa página. Só um link perdido por aí.
      </footer>
    </div>
  );
}
