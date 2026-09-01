import React from 'react';
import { useApp } from '../../state/AppContext';

interface NeonCardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  noPadding?: boolean;
  accentVariant?: 'grey' | 'crimson' | 'emerald' | 'amber';
  isInteractive?: boolean;
  onClick?: () => void;
}

export const NeonCard: React.FC<NeonCardProps> = ({
  children,
  className = '',
  id,
  noPadding = false,
  accentVariant = 'grey',
  isInteractive = false,
  onClick,
}) => {
  const { theme } = useApp();

  // Conic gradient colors for rotating perimeter neon border
  const getConicBorderGradient = () => {
    switch (accentVariant) {
      case 'crimson':
        return 'conic-gradient(from 0deg at 50% 50%, rgba(239, 68, 68, 0) 0deg, rgba(239, 68, 68, 0.9) 60deg, rgba(254, 205, 211, 0.95) 90deg, rgba(239, 68, 68, 0.3) 120deg, rgba(239, 68, 68, 0) 180deg, rgba(239, 68, 68, 0) 360deg)';
      case 'emerald':
        return 'conic-gradient(from 0deg at 50% 50%, rgba(16, 185, 129, 0) 0deg, rgba(16, 185, 129, 0.9) 60deg, rgba(167, 243, 208, 0.95) 90deg, rgba(16, 185, 129, 0.3) 120deg, rgba(16, 185, 129, 0) 180deg, rgba(16, 185, 129, 0) 360deg)';
      case 'amber':
        return 'conic-gradient(from 0deg at 50% 50%, rgba(245, 158, 11, 0) 0deg, rgba(245, 158, 11, 0.9) 60deg, rgba(254, 240, 138, 0.95) 90deg, rgba(245, 158, 11, 0.3) 120deg, rgba(245, 158, 11, 0) 180deg, rgba(245, 158, 11, 0) 360deg)';
      case 'grey':
      default:
        // Sophisticated dark neon grey / mild grey animated beam that rotates throughout the whole perimeter
        return theme === 'dark'
          ? 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(100, 116, 139, 0.1) 40deg, rgba(148, 163, 184, 0.75) 80deg, rgba(241, 245, 249, 0.95) 100deg, rgba(148, 163, 184, 0.7) 120deg, transparent 180deg, transparent 360deg)'
          : 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(148, 163, 184, 0.2) 40deg, rgba(100, 116, 139, 0.7) 80deg, rgba(51, 65, 85, 0.95) 100deg, rgba(100, 116, 139, 0.5) 120deg, transparent 180deg, transparent 360deg)';
    }
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative rounded-2xl p-[1.5px] overflow-hidden transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-slate-800/60 shadow-xl shadow-black/80 ring-1 ring-white/10 hover:ring-slate-400/30'
          : 'bg-slate-200/90 shadow-md shadow-slate-200/60 ring-1 ring-slate-100 hover:shadow-lg'
      } ${isInteractive ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 1. Base Mild Grey Static Perimeter Border */}
      <div
        className={`absolute inset-0 rounded-2xl pointer-events-none transition-colors ${
          theme === 'dark' ? 'bg-[#1e2330]' : 'bg-[#e2e8f0]'
        }`}
      />

      {/* 2. Rotating Neon Beam that travels slowly throughout the entire rectangle perimeter */}
      <div className="absolute -inset-[150%] pointer-events-none overflow-hidden flex items-center justify-center">
        <div
          className="w-[200%] h-[200%] animate-neon-border-rotate"
          style={{
            background: getConicBorderGradient(),
            willChange: 'transform',
          }}
        />
      </div>

      {/* 3. Card Inner Canvas Body */}
      <div
        className={`relative w-full h-full rounded-[14.5px] overflow-hidden transition-all duration-300 flex flex-col justify-between ${
          theme === 'dark'
            ? 'bg-[#0c0e15] text-white'
            : 'bg-white text-slate-900'
        } ${noPadding ? '' : 'p-4'}`}
      >
        {/* Subtle slow dark-neon grey sweeping ambient sheen across inner rectangle */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className={`absolute -inset-full w-[250%] h-[250%] bg-gradient-to-r ${
              theme === 'dark'
                ? 'from-transparent via-slate-400/[0.04] to-transparent'
                : 'from-transparent via-slate-500/[0.03] to-transparent'
            } animate-neon-sheen-slow`}
            style={{ willChange: 'transform' }}
          />
        </div>

        {/* Subtle Corner Tactical Accents in Dark Mode */}
        {theme === 'dark' && (
          <>
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-slate-400/40 rounded-tl-[14px] pointer-events-none z-10" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-slate-400/40 rounded-tr-[14px] pointer-events-none z-10" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-slate-600/30 rounded-bl-[14px] pointer-events-none z-10" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-slate-600/30 rounded-br-[14px] pointer-events-none z-10" />
          </>
        )}

        {/* Inner Content */}
        <div className="relative z-10 h-full flex flex-col justify-between">
          {children}
        </div>
      </div>
    </div>
  );
};
