import React, { useState } from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { ArrowUpRight } from 'lucide-react';

export const RevenuePerformanceCard: React.FC = () => {
  const { theme } = useApp();
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1W');

  const bars = [
    { label: 'Week 1', height: 45, isHighlight: false },
    { label: 'Week 2', height: 55, isHighlight: false },
    { label: 'Week 3', height: 50, isHighlight: false },
    { label: 'Week 4', height: 85, isHighlight: true }, // Red bar highlighted
    { label: 'Week 5', height: 60, isHighlight: false },
    { label: 'Week 6', height: 65, isHighlight: false },
  ];

  return (
    <NeonCard className="h-full min-h-[260px]" accentVariant="grey">
      {/* Top Header & Range Toggles */}
      <div
        className={`flex items-center justify-between pb-2 border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <h3 className="font-bold text-xs">Revenue Performance</h3>
        <div
          className={`flex items-center gap-1 p-0.5 rounded-lg text-[10px] font-semibold ${
            theme === 'dark' ? 'bg-[#151622] text-zinc-400' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {(['1D', '1W', '1M', '3M', '1Y'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                timeframe === t
                  ? theme === 'dark'
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metric */}
      <div className="my-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black tracking-tight">$780K</span>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-500">
            <ArrowUpRight size={14} />
            13.6% <span className="text-[10px] opacity-60 font-normal">vs Last Week</span>
          </span>
        </div>
      </div>

      {/* Bar Chart with Highlighted Callout */}
      <div className="relative pt-6 pb-2">
        {/* Floating Callout badge above Week 4 */}
        <div
          className={`absolute top-0 left-[55%] -translate-x-1/2 px-2 py-1 rounded-md shadow-md border text-center z-10 ${
            theme === 'dark'
              ? 'bg-[#151622] border-red-500/40 text-white'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="text-[8.5px] opacity-60 font-medium leading-none">Averted Loss</div>
          <div className="text-[10px] font-extrabold text-red-500 leading-tight">$245K This Week</div>
          <div
            className={`w-1.5 h-1.5 border-b border-r transform rotate-45 mx-auto -mb-1.5 ${
              theme === 'dark'
                ? 'bg-[#151622] border-red-500/40'
                : 'bg-white border-slate-200'
            }`}
          />
        </div>

        <div className="flex items-end justify-between gap-2 h-24 px-2">
          {bars.map((b) => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div
                className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ${
                  b.isHighlight
                    ? 'bg-gradient-to-t from-red-600 to-rose-500 shadow-md'
                    : theme === 'dark'
                    ? 'bg-[#1e202e] hover:bg-[#282a3d]'
                    : 'bg-slate-200 hover:bg-slate-300'
                }`}
                style={{ height: `${b.height}%` }}
              />
              <span className="text-[9.5px] opacity-60 font-medium">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </NeonCard>
  );
};
