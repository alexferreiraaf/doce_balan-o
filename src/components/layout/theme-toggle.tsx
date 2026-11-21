'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

function WhiteChocolateBar3D({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="whiteChocShadow" x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="1.8" floodColor="#5c3a21" floodOpacity="0.45" />
        </filter>
        <linearGradient id="whiteChocBody" x1="12" y1="6" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFDF7" />
          <stop offset="50%" stopColor="#F8E9C4" />
          <stop offset="100%" stopColor="#DEC48F" />
        </linearGradient>
        <linearGradient id="whiteChocSquare" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FBF0D4" />
          <stop offset="100%" stopColor="#E5CD9B" />
        </linearGradient>
        <linearGradient id="whiteWrapper" x1="12" y1="36" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#DB2777" />
          <stop offset="100%" stopColor="#9D174D" />
        </linearGradient>
        <linearGradient id="goldFoil" x1="14" y1="34" x2="50" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      <g filter="url(#whiteChocShadow)" transform="rotate(-10 32 32)">
        <rect x="15" y="9" width="34" height="46" rx="5" fill="#B89B67" />
        <rect x="14" y="6" width="34" height="46" rx="5" fill="url(#whiteChocBody)" stroke="#C9AD79" strokeWidth="1" />

        {/* Fileira 1 */}
        <g>
          <rect x="17" y="9" width="13" height="11" rx="2" fill="#C7AB78" />
          <rect x="17" y="9" width="12.2" height="10.2" rx="2" fill="url(#whiteChocSquare)" />
          <path d="M18.5 10.5H27.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        </g>
        <g>
          <rect x="32" y="9" width="13" height="11" rx="2" fill="#C7AB78" />
          <rect x="32" y="9" width="12.2" height="10.2" rx="2" fill="url(#whiteChocSquare)" />
          <path d="M33.5 10.5H42.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        </g>

        {/* Fileira 2 */}
        <g>
          <rect x="17" y="22" width="13" height="11" rx="2" fill="#C7AB78" />
          <rect x="17" y="22" width="12.2" height="10.2" rx="2" fill="url(#whiteChocSquare)" />
          <path d="M18.5 23.5H27.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        </g>
        <g>
          <rect x="32" y="22" width="13" height="11" rx="2" fill="#C7AB78" />
          <rect x="32" y="22" width="12.2" height="10.2" rx="2" fill="url(#whiteChocSquare)" />
          <path d="M33.5 23.5H42.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        </g>

        {/* Folha dourada */}
        <path
          d="M13.5 36L18 33.5L23 36.5L28 33L34 36.5L39.5 33.5L44 36.5L48.5 34.5V41H13.5V36Z"
          fill="url(#goldFoil)"
        />

        {/* Embalagem inferior */}
        <rect x="13" y="38" width="36" height="17" rx="4" fill="#831843" />
        <rect x="13" y="36.5" width="36" height="16.5" rx="4" fill="url(#whiteWrapper)" stroke="#F9A8D4" strokeWidth="0.8" />
        <path d="M16 40H30" stroke="#FBCFE8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <path d="M16 49H45" stroke="#9D174D" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      </g>
    </svg>
  );
}

function DarkChocolateBar3D({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="darkChocShadow" x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.65" />
        </filter>
        <linearGradient id="darkChocBody" x1="12" y1="6" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5C2E14" />
          <stop offset="50%" stopColor="#3B1B0B" />
          <stop offset="100%" stopColor="#1F0C04" />
        </linearGradient>
        <linearGradient id="darkChocSquare" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#733B1C" />
          <stop offset="55%" stopColor="#46200D" />
          <stop offset="100%" stopColor="#271005" />
        </linearGradient>
        <linearGradient id="darkWrapper" x1="12" y1="36" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="silverFoil" x1="14" y1="34" x2="50" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F3F4F6" />
          <stop offset="50%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>
      </defs>

      <g filter="url(#darkChocShadow)" transform="rotate(-10 32 32)">
        <rect x="15" y="9" width="34" height="46" rx="5" fill="#140702" />
        <rect x="14" y="6" width="34" height="46" rx="5" fill="url(#darkChocBody)" stroke="#2A1206" strokeWidth="1" />

        {/* Fileira 1 */}
        <g>
          <rect x="17" y="9" width="13" height="11" rx="2" fill="#1A0903" />
          <rect x="17" y="9" width="12.2" height="10.2" rx="2" fill="url(#darkChocSquare)" />
          <path d="M18.5 10.5H27.5" stroke="#9A5B35" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </g>
        <g>
          <rect x="32" y="9" width="13" height="11" rx="2" fill="#1A0903" />
          <rect x="32" y="9" width="12.2" height="10.2" rx="2" fill="url(#darkChocSquare)" />
          <path d="M33.5 10.5H42.5" stroke="#9A5B35" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* Fileira 2 */}
        <g>
          <rect x="17" y="22" width="13" height="11" rx="2" fill="#1A0903" />
          <rect x="17" y="22" width="12.2" height="10.2" rx="2" fill="url(#darkChocSquare)" />
          <path d="M18.5 23.5H27.5" stroke="#9A5B35" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </g>
        <g>
          <rect x="32" y="22" width="13" height="11" rx="2" fill="#1A0903" />
          <rect x="32" y="22" width="12.2" height="10.2" rx="2" fill="url(#darkChocSquare)" />
          <path d="M33.5 23.5H42.5" stroke="#9A5B35" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* Folha prateada */}
        <path
          d="M13.5 36L18 33.5L23 36.5L28 33L34 36.5L39.5 33.5L44 36.5L48.5 34.5V41H13.5V36Z"
          fill="url(#silverFoil)"
        />

        {/* Embalagem inferior */}
        <rect x="13" y="38" width="36" height="17" rx="4" fill="#451A03" />
        <rect x="13" y="36.5" width="36" height="16.5" rx="4" fill="url(#darkWrapper)" stroke="#FCD34D" strokeWidth="0.8" />
        <path d="M16 40H30" stroke="#FEF3C7" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
        <path d="M16 49H45" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  const toggleTheme = () => {
    setIsAnimating(true);
    setTheme(isDark ? 'light' : 'dark');
    setTimeout(() => setIsAnimating(false), 650);
  };

  return (
    <>
      <style jsx>{`
        @keyframes chocFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-1.8px) rotate(4deg);
          }
        }
        @keyframes cloudDriftSlow {
          0%, 100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(6px);
          }
        }
        @keyframes cloudDriftFast {
          0%, 100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(-5px);
          }
        }
        @keyframes starTwinkle {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.85);
          }
          50% {
            opacity: 1;
            transform: scale(1.25);
          }
        }
        @keyframes moonGlow {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.08) rotate(-5deg);
          }
        }
        @keyframes shootingStar {
          0%, 75%, 100% {
            opacity: 0;
            transform: translate(0, 0) scale(0.5);
          }
          80% {
            opacity: 1;
          }
          90% {
            opacity: 0;
            transform: translate(-28px, 14px) scale(1);
          }
        }
        @keyframes haloPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.55;
          }
        }
        @keyframes glassShimmer {
          0% {
            transform: translateX(-140%) skewX(-25deg);
          }
          100% {
            transform: translateX(240%) skewX(-25deg);
          }
        }
        .choc-float {
          animation: chocFloat 3s ease-in-out infinite;
        }
        .cloud-slow {
          animation: cloudDriftSlow 5s ease-in-out infinite;
        }
        .cloud-fast {
          animation: cloudDriftFast 4s ease-in-out infinite;
        }
        .star-1 {
          animation: starTwinkle 2.2s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .star-2 {
          animation: starTwinkle 3s ease-in-out 0.8s infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .moon-anim {
          animation: moonGlow 4s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .shooting-star {
          animation: shootingStar 6s ease-out infinite;
        }
        .halo-1 {
          animation: haloPulse 2.8s ease-in-out infinite;
        }
        .halo-2 {
          animation: haloPulse 2.8s ease-in-out 0.35s infinite;
        }
        .halo-3 {
          animation: haloPulse 2.8s ease-in-out 0.7s infinite;
        }
        .group:hover .shimmer-sweep {
          animation: glassShimmer 0.85s ease-in-out;
        }
      `}</style>

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        title={
          isDark
            ? 'Tema Escuro (Chocolate Preto) — Clique para Tema Claro'
            : 'Tema Claro (Chocolate Branco) — Clique para Tema Escuro'
        }
        aria-label="Alternar tema"
        className="group relative inline-flex items-center w-[88px] h-[40px] rounded-full p-[3px] select-none cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 bg-gradient-to-b from-[#1e1f24] to-[#2d2f36] shadow-[0_3px_8px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.18)] hover:shadow-[0_5px_14px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.28)]"
      >
        {/* Trilha interna da pílula com cenário vivo */}
        <div className="relative w-full h-full rounded-full overflow-hidden shadow-[inset_0_3px_6px_rgba(0,0,0,0.55)]">
          {/* CENÁRIO TEMA CLARO (Rosa / Dunas e Nuvens com movimento Parallax) */}
          <svg
            viewBox="0 0 160 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
              isDark ? 'opacity-0 translate-y-3 scale-105' : 'opacity-100 translate-y-0 scale-100'
            }`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="lightSky" x1="0" y1="0" x2="160" y2="72" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#E6A1B5" />
                <stop offset="50%" stopColor="#F3A6B8" />
                <stop offset="100%" stopColor="#E56F8C" />
              </linearGradient>
            </defs>
            <rect width="160" height="72" fill="url(#lightSky)" />

            {/* Nuvens flutuando suavemente */}
            <g className="cloud-slow" opacity="0.5" fill="#FFE4EC">
              <circle cx="34" cy="20" r="10" />
              <circle cx="44" cy="22" r="7" />
              <circle cx="25" cy="23" r="6" />
            </g>
            <g className="cloud-fast" opacity="0.45" fill="#FFE4EC">
              <circle cx="72" cy="15" r="8" />
              <circle cx="80" cy="17" r="6" />
              <circle cx="65" cy="18" r="5" />
            </g>

            {/* Brilhos cintilantes do dia */}
            <circle className="star-1" cx="22" cy="30" r="1.4" fill="#FFF5F7" />
            <circle className="star-2" cx="55" cy="26" r="1.3" fill="#FFF5F7" />
            <circle className="star-1" cx="86" cy="18" r="1.5" fill="#FFF5F7" />

            {/* Dunas / Colinas rosadas em camadas */}
            <path
              d="M-5 62 C20 42, 42 34, 58 35 C75 36, 95 48, 120 62 L120 75 L-5 75 Z"
              fill="#C93B6B"
            />
            <path
              d="M35 35 C52 36, 72 45, 92 52 C74 53, 55 46, 35 35 Z"
              fill="#9E2252"
              opacity="0.7"
            />
            <path
              d="M-5 66 C18 54, 48 48, 76 58 C95 65, 115 68, 135 72 L-5 72 Z"
              fill="#E06388"
            />
            <path
              d="M25 56 C42 52, 58 56, 68 62 C50 64, 34 62, 25 56 Z"
              fill="#8F1D49"
              opacity="0.65"
            />
          </svg>

          {/* CENÁRIO TEMA ESCURO (Noite Roxa / Lua, Estrelas cintilantes e Estrela cadente) */}
          <svg
            viewBox="0 0 160 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
              isDark ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-3 scale-105'
            }`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="darkSky" x1="0" y1="0" x2="160" y2="72" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4F448C" />
                <stop offset="55%" stopColor="#3B2F75" />
                <stop offset="100%" stopColor="#261E54" />
              </linearGradient>
            </defs>
            <rect width="160" height="72" fill="url(#darkSky)" />

            {/* Estrelas cintilantes */}
            <circle className="star-1" cx="92" cy="18" r="1.3" fill="#FFFFFF" />
            <circle className="star-2" cx="110" cy="14" r="1.1" fill="#FFFFFF" />
            <circle className="star-1" cx="142" cy="24" r="1.3" fill="#FFFFFF" />
            <circle className="star-2" cx="122" cy="27" r="1" fill="#FFFFFF" />

            {/* Estrela cadente periódica */}
            <path
              className="shooting-star"
              d="M125 10 L113 16"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Lua Crescente brilhante com pulsação suave */}
            <g className="moon-anim">
              <circle cx="131" cy="17" r="8.5" fill="#A5B4FC" opacity="0.24" />
              <path
                d="M133.5 11.5 A5.5 5.5 0 1 0 137 20.5 A4.5 4.5 0 1 1 133.5 11.5 Z"
                fill="#FFFFFF"
              />
            </g>

            {/* Dunas / Colinas noturnas em camadas */}
            <path
              d="M78 44 C98 32, 116 28, 130 33 C144 38, 155 48, 165 56 L165 72 L65 72 Z"
              fill="#28235C"
            />
            <path
              d="M60 72 C85 52, 112 45, 138 52 C150 55, 158 60, 165 65 L165 72 Z"
              fill="#5E4B9B"
              opacity="0.75"
            />
            <path
              d="M105 51 C122 47, 138 52, 152 59 C134 62, 116 58, 105 51 Z"
              fill="#231D52"
              opacity="0.85"
            />
          </svg>

          {/* Anéis concêntricos pulsantes (Halo) que acompanham o botão redondo */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-[34px] h-[34px] transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none ${
              isDark ? 'translate-x-0' : 'translate-x-[48px]'
            }`}
          >
            <div className="halo-3 absolute -inset-[18px] rounded-full bg-white/10" />
            <div className="halo-2 absolute -inset-[11px] rounded-full bg-white/15" />
            <div className="halo-1 absolute -inset-[5px] rounded-full bg-white/20" />
          </div>

          {/* Reflexo diagonal fixo de vidro + Feixe de luz animado no hover */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(125deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 42%, rgba(255,255,255,0) 43%)',
            }}
          />
          <div className="shimmer-sweep absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none -translate-x-[150%]" />

          {/* Botão Redondo 3D Deslizante com Rolagem Elástica + Barrinha Flutuante */}
          <div
            className={[
              'relative z-10 w-[34px] h-[34px] rounded-full flex items-center justify-center',
              'transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              isAnimating ? 'scale-90' : 'scale-100',
              isDark
                ? [
                    'translate-x-0 rotate-0',
                    'bg-gradient-to-b from-[#353842] via-[#262830] to-[#18191E]',
                    'border border-[#4B4F5C]',
                    'shadow-[0_3px_6px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.25)]',
                  ].join(' ')
                : [
                    'translate-x-[48px] rotate-[360deg]',
                    'bg-gradient-to-b from-[#FFFDF7] via-[#F7E7C0] to-[#DEC28B]',
                    'border border-[#FFFFFF]',
                    'shadow-[0_3px_6px_rgba(92,58,33,0.45),inset_0_1px_2px_rgba(255,255,255,0.95)]',
                  ].join(' '),
            ].join(' ')}
          >
            {/* Barrinha de Chocolate Branco 3D (Tema Claro) */}
            <span
              className={`choc-float absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                isDark
                  ? 'opacity-0 scale-0 -rotate-180 pointer-events-none'
                  : 'opacity-100 scale-100 rotate-0 group-hover:scale-115 group-hover:-rotate-6'
              }`}
            >
              <WhiteChocolateBar3D className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
            </span>

            {/* Barrinha de Chocolate Preto 3D (Tema Escuro) */}
            <span
              className={`choc-float absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                isDark
                  ? 'opacity-100 scale-100 rotate-0 group-hover:scale-115 group-hover:rotate-6'
                  : 'opacity-0 scale-0 rotate-180 pointer-events-none'
              }`}
            >
              <DarkChocolateBar3D className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
            </span>
          </div>
        </div>

        <span className="sr-only">Alternar tema</span>
      </button>
    </>
  );
}
