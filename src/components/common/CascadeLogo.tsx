import React from 'react';
import { useApp } from '../../state/AppContext';

interface CascadeLogoProps {
  size?: number;
  showText?: boolean;
  collapsed?: boolean;
}

export const CascadeLogo: React.FC<CascadeLogoProps> = ({
  size = 36,
  showText = true,
  collapsed = false,
}) => {
  const { theme } = useApp();

  return (
    <div className="flex items-center gap-2.5 group select-none">
      {/* Icon Container with Iconic Spider-Man Insignia */}
      <div
        style={{ width: size, height: size }}
        className={`relative shrink-0 rounded-xl flex items-center justify-center p-1.5 transition-all duration-300 overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#12131a] border border-red-500/40 shadow-lg shadow-red-950/40 group-hover:border-red-500 group-hover:shadow-red-900/50'
            : 'bg-white border border-slate-200 shadow-2xs group-hover:border-red-400 group-hover:shadow-xs'
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Iconic Spider-Man Spider Emblem */}
          <g fill={theme === 'dark' ? '#ef4444' : '#dc2626'}>
            {/* Center Head and Upper Mandibles */}
            <path d="M50 24 C47 20 44 19 41 21 C42 24 45 27 46 30 C43 31 40 34 39 38 C39 42 42 46 45 48 C46 51 47 54 50 55 C53 54 54 51 55 48 C58 46 61 42 61 38 C60 34 57 31 54 30 C55 27 58 24 59 21 C56 19 53 20 50 24 Z" />

            {/* Angular Lower Abdomen with Stinger */}
            <path d="M50 49 C45 51 39 57 38 65 C36 74 41 84 48 93 C49 94 50 95 50 95 C50 95 51 94 52 93 C59 84 64 74 62 65 C61 57 55 51 50 49 Z" />

            {/* Top Leg 1 - Left (Angular upward strike) */}
            <path d="M44 32 C37 20 28 8 26 2 C32 10 39 21 46 29 Z" />
            {/* Top Leg 1 - Right */}
            <path d="M56 32 C63 20 72 8 74 2 C68 10 61 21 54 29 Z" />

            {/* Upper Leg 2 - Left (Curving out and up) */}
            <path d="M41 36 C30 26 18 17 8 10 C14 20 25 31 38 37 Z" />
            {/* Upper Leg 2 - Right */}
            <path d="M59 36 C70 26 82 17 92 10 C86 20 75 31 62 37 Z" />

            {/* Middle Leg 3 - Left (Spreading wide) */}
            <path d="M39 42 C24 38 12 36 2 34 C10 44 23 48 37 46 Z" />
            {/* Middle Leg 3 - Right */}
            <path d="M61 42 C76 38 88 36 98 34 C90 44 77 48 63 46 Z" />

            {/* Middle Leg 4 - Left (Sweeping downward) */}
            <path d="M40 48 C24 52 10 60 4 72 C14 64 27 58 38 53 Z" />
            {/* Middle Leg 4 - Right */}
            <path d="M60 48 C76 52 90 60 96 72 C86 64 73 58 62 53 Z" />

            {/* Lower Leg 5 - Left (Long trailing bottom spider leg) */}
            <path d="M42 58 C28 72 16 88 18 99 C22 84 32 68 44 57 Z" />
            {/* Lower Leg 5 - Right */}
            <path d="M58 58 C72 72 84 88 82 99 C78 84 68 68 56 57 Z" />

            {/* Inner Bottom Leg 6 - Left */}
            <path d="M46 68 C38 78 34 89 36 98 C38 88 43 78 48 69 Z" />
            {/* Inner Bottom Leg 6 - Right */}
            <path d="M54 68 C62 78 66 89 64 98 C62 88 57 78 52 69 Z" />
          </g>
        </svg>
      </div>

      {showText && !collapsed && (
        <div className="flex flex-col min-w-0">
          <div className="font-black text-lg tracking-tight leading-none flex items-center gap-1.5">
            <span className={theme === 'dark' ? 'text-white tracking-wider' : 'text-slate-900'}>
              CASCADE
            </span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-red-600 text-white tracking-wider">
              AI
            </span>
          </div>
          <span
            className={`text-[9px] font-medium leading-tight mt-0.5 truncate ${
              theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            Infrastructure Cascade Analysis Engine
          </span>
        </div>
      )}
    </div>
  );
};
