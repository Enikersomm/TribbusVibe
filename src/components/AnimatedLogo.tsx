import React from 'react';
import { useAppLogo } from '../utils/logo';

interface AnimatedLogoProps {
  size?: 'normal' | 'compact';
  onClick?: () => void;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  size = 'normal',
  onClick,
}) => {
  const { logoSrc } = useAppLogo();
  const currentLogo = logoSrc || '/logo.png';

  if (size === 'compact') {
    return (
      <div
        onClick={onClick}
        className="relative flex items-center justify-center gap-2 cursor-pointer group"
        title="Tribbu'sVibe - Conectando pessoas de verdade"
      >
        <img
          src={currentLogo}
          alt="Tribbu'sVibe Logo"
          className="h-10 sm:h-12 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform select-none"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.src = '/logo.png';
          }}
        />
        <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#FF007F] via-[#9400D3] to-[#00F0FF] bg-clip-text text-transparent">
          Tribbu'sVibe
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center select-none py-1">
      {/* 🪐 PALCO ORBITAL COM POEIRA CÓSMICA */}
      <div
        onClick={onClick}
        className="orbit-universe-stage select-none group"
        title="Tribbu'sVibe - Conectando pessoas de verdade"
      >
        {/* 🌟 1. CAMADA DE FUNDO: Halo de luz e anéis orbitais atrás da logo */}
        <div className="cosmic-orbit-backdrop">
          {/* Halo estelar difuso neon */}
          <div className="cosmic-glow-halo" />

          {/* Anéis de órbita 3D */}
          <div className="orbit-path-ring-main" />
          <div className="orbit-path-ring-secondary" />
          <div className="orbit-path-ring-outer" />

          {/* Poeira Cósmica em Órbita Atrás da Logo */}
          <div className="cosmic-dust-stream-1">
            <span className="dust-mote w-2 h-2 text-[#FF1493] bg-[#FF1493] top-2 left-10" style={{ animationDelay: '0.2s' }} />
            <span className="dust-mote w-1.5 h-1.5 text-[#00BFFF] bg-[#00BFFF] bottom-4 left-14" style={{ animationDelay: '0.8s' }} />
            <span className="dust-mote w-2 h-2 text-[#FFD700] bg-[#FFD700] top-5 right-12" style={{ animationDelay: '1.4s' }} />
            <span className="dust-mote w-1 h-1 text-[#00FF7F] bg-[#00FF7F] bottom-3 right-16" style={{ animationDelay: '0.5s' }} />
            <span className="dust-mote w-2.5 h-2.5 text-[#FF69B4] bg-[#FF69B4] top-1/2 left-1" style={{ animationDelay: '2.1s' }} />
            <span className="dust-mote w-1.5 h-1.5 text-[#9400D3] bg-[#9400D3] top-1/2 right-1" style={{ animationDelay: '1.7s' }} />
          </div>

          <div className="cosmic-dust-stream-2">
            <span className="dust-mote w-2 h-2 text-[#00E5FF] bg-[#00E5FF] top-3 left-16" style={{ animationDelay: '0.4s' }} />
            <span className="dust-mote w-1.5 h-1.5 text-[#FF1493] bg-[#FF1493] bottom-2 left-20" style={{ animationDelay: '1.1s' }} />
            <span className="dust-mote w-2 h-2 text-[#FFDF00] bg-[#FFDF00] top-4 right-14" style={{ animationDelay: '1.9s' }} />
            <span className="dust-mote w-1.5 h-1.5 text-[#76FF03] bg-[#76FF03] bottom-5 right-20" style={{ animationDelay: '0.9s' }} />
          </div>

          <div className="cosmic-dust-stream-3">
            <span className="dust-mote w-1.5 h-1.5 text-[#FF007F] bg-[#FF007F] top-2 left-24" style={{ animationDelay: '0.6s' }} />
            <span className="dust-mote w-2 h-2 text-[#00F5D4] bg-[#00F5D4] bottom-3 left-28" style={{ animationDelay: '1.5s' }} />
            <span className="dust-mote w-1.5 h-1.5 text-[#FEE440] bg-[#FEE440] top-3 right-24" style={{ animationDelay: '2.3s' }} />
            <span className="dust-mote w-2 h-2 text-[#9B5DE5] bg-[#9B5DE5] bottom-2 right-28" style={{ animationDelay: '1.2s' }} />
          </div>
        </div>

        {/* 🌍 2. LOGO OFICIAL 3D NO CENTRO (Flutuando majestosamente) */}
        <div className="orkuvibe-planet-core flex items-center justify-center">
          <img
            className="w-48 sm:w-60 md:w-72 h-auto object-contain drop-shadow-[0_15px_30px_rgba(255,0,127,0.35)] drop-shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-transform duration-300 group-hover:scale-105"
            src={currentLogo}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = '/logo.png';
            }}
            alt="Tribbu'sVibe Logo Oficial"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* ✨ 3. CAMADA FRONTAL: Poeira cósmica e estrelinhas cintilantes que orbitam sobre a logo */}
        <div className="cosmic-orbit-foreground">
          <div className="cosmic-dust-stream-1" style={{ animationDirection: 'normal', animationDuration: '10s' }}>
            <span className="dust-mote w-2.5 h-2.5 text-[#FFF] bg-[#FFF] top-1 left-28" style={{ animationDelay: '0.3s' }} />
            <span className="dust-mote w-2 h-2 text-[#00BFFF] bg-[#00BFFF] bottom-1 left-32" style={{ animationDelay: '1.2s' }} />
            <span className="dust-mote w-1.5 h-1.5 text-[#FF69B4] bg-[#FF69B4] top-2 right-32" style={{ animationDelay: '2.0s' }} />
            <span className="dust-mote w-2 h-2 text-[#FFD700] bg-[#FFD700] bottom-1 right-28" style={{ animationDelay: '0.7s' }} />
          </div>

          <div className="cosmic-dust-stream-2" style={{ animationDuration: '14s' }}>
            <span className="dust-mote w-1.5 h-1.5 text-[#FFF] bg-[#FFF] top-6 left-12" style={{ animationDelay: '1.6s' }} />
            <span className="dust-mote w-2 h-2 text-[#FF1493] bg-[#FF1493] bottom-6 right-12" style={{ animationDelay: '0.1s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
