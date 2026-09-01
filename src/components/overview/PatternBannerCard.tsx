import React from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { Target, CheckCircle2, ChevronRight } from 'lucide-react';

export const PatternBannerCard: React.FC = () => {
  const { setActiveRoute, theme } = useApp();

  return (
    <NeonCard className="h-full min-h-[220px]" accentVariant="grey">
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-2 border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <h3 className="font-bold text-xs">Pattern Match</h3>
        <span className="px-1.5 py-0.5 rounded bg-red-600/15 text-red-500 font-bold text-[9px]">
          91% MATCH
        </span>
      </div>

      <div className="my-2">
        <div className="text-xs font-black text-red-600 dark:text-red-400">
          Cascading Heatwave Spike #0421
        </div>
        <p className="text-[10px] opacity-70 mt-1 leading-tight">
          Matches historical pattern from Jul 2024 Eastern Grid Interconnect. Recommending proactive load balance.
        </p>
      </div>

      <button
        onClick={() => setActiveRoute('events')}
        className="w-full py-1.5 px-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
      >
        <span>Inspect Pattern</span>
        <ChevronRight size={13} />
      </button>
    </NeonCard>
  );
};
