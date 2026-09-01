import React from 'react';
import { useApp } from '../../state/AppContext';

export const SidebarSpiderIllustration: React.FC = () => {
  const { selectedScenario, theme } = useApp();

  return (
    <div
      className={`relative flex-1 flex flex-col justify-between items-center px-3 pt-2 pb-2.5 overflow-hidden select-none min-h-[250px] transition-colors duration-300 border-t ${
        theme === 'dark'
          ? 'bg-[#0a0b10] border-white/10'
          : 'bg-white border-slate-100'
      }`}
    >
      {/* Background Web Artwork */}
      <div
        className={`absolute inset-0 pointer-events-none flex items-center justify-center ${
          theme === 'dark' ? 'opacity-20' : 'opacity-40'
        }`}
      >
        <svg
          viewBox="0 0 300 360"
          className={`w-full h-full ${
            theme === 'dark' ? 'stroke-red-500' : 'stroke-slate-300'
          }`}
          fill="none"
          strokeWidth="1"
        >
          <line x1="60" y1="140" x2="-20" y2="20" />
          <line x1="60" y1="140" x2="10" y2="-30" />
          <line x1="60" y1="140" x2="80" y2="-40" />
          <line x1="60" y1="140" x2="160" y2="-30" />
          <line x1="60" y1="140" x2="250" y2="0" />
          <line x1="60" y1="140" x2="320" y2="50" />
          <line x1="60" y1="140" x2="330" y2="130" />
          <line x1="60" y1="140" x2="320" y2="220" />
          <line x1="60" y1="140" x2="270" y2="310" />
          <line x1="60" y1="140" x2="180" y2="380" />
          <line x1="60" y1="140" x2="90" y2="390" />
          <line x1="60" y1="140" x2="10" y2="350" />
          <line x1="60" y1="140" x2="-30" y2="260" />
          <line x1="60" y1="140" x2="-40" y2="160" />

          <path d="M-10,35 Q30,60 50,20 Q80,2 120,-5 Q160,20 200,10 Q240,40 270,70" />
          <path d="M-20,95 Q10,105 40,80 Q70,45 110,35 Q150,55 190,45 Q230,70 280,110" />
          <path d="M-30,150 Q10,140 35,120 Q65,85 105,75 Q145,95 185,85 Q225,110 275,150" />
          <path d="M-25,210 Q10,185 30,165 Q60,135 100,125 Q140,145 180,135 Q220,160 270,200" />
          <path d="M-15,270 Q15,235 35,210 Q60,180 95,175 Q135,195 175,185 Q215,210 260,250" />
          <path d="M5,320 Q25,285 45,260 Q70,230 100,225 Q135,245 175,235 Q210,260 250,300" />
        </svg>
      </div>

      {/* Scenario Identifier Pill at Bottom */}
      <div
        className={`relative z-10 mt-auto w-full pt-2 border-t flex items-center gap-2 transition-colors ${
          theme === 'dark'
            ? 'border-white/10 text-white bg-[#0a0b10]'
            : 'border-slate-100 text-slate-800 bg-white'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
            theme === 'dark'
              ? 'bg-[#141520] border-red-500/40 shadow-xs'
              : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <svg viewBox="0 0 100 100" className="w-3.5 h-3.5 fill-red-600">
            <path d="M50 24 C47 20 44 19 41 21 C42 24 45 27 46 30 C43 31 40 34 39 38 C39 42 42 46 45 48 C46 51 47 54 50 55 C53 54 54 51 55 48 C58 46 61 42 61 38 C60 34 57 31 54 30 C55 27 58 24 59 21 C56 19 53 20 50 24 Z" />
            <path d="M50 49 C45 51 39 57 38 65 C36 74 41 84 48 93 C49 94 50 95 50 95 C50 95 51 94 52 93 C59 84 64 74 62 65 C61 57 55 51 50 49 Z" />
            <path d="M44 32 C37 20 28 8 26 2 C32 10 39 21 46 29 Z" />
            <path d="M56 32 C63 20 72 8 74 2 C68 10 61 21 54 29 Z" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-[9px] opacity-60 font-semibold uppercase tracking-wider leading-none">
            Scenario
          </div>
          <div className="text-[10px] font-bold truncate leading-tight mt-0.5 text-red-500">
            {selectedScenario.name}
          </div>
        </div>
      </div>
    </div>
  );
};
