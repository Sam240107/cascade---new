import React from 'react';
import { useApp } from '../../state/AppContext';
import { Database, Clock, Zap } from 'lucide-react';

interface SubHeaderProps {
  title: string;
  subtitle?: string;
}

export const SubHeader: React.FC<SubHeaderProps> = ({ title, subtitle }) => {
  const { activeEvent, dataSourceMode, selectedScenario, setActiveRoute, simulationTime, lastUpdated, theme } =
    useApp();

  return (
    <div
      className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-[#0c0d14]/70 border-white/10 text-white'
          : 'bg-white/60 border-slate-200/80 text-slate-900'
      }`}
    >
      <div>
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <span>{title}</span>
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
          {/* Active Event with pulsing red dot */}
          <div
            onClick={() => setActiveRoute('events')}
            className="flex items-center gap-1.5 font-bold text-red-500 cursor-pointer hover:underline"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span className="opacity-80">Active Event:</span>
            <span className="font-extrabold text-red-600 dark:text-red-400">{activeEvent.name}</span>
          </div>

          <span className={theme === 'dark' ? 'text-zinc-600' : 'text-slate-300'}>•</span>

          {/* Last updated - Perfectly Synced with Live Simulation Time */}
          <div
            className={`flex items-center gap-1 font-medium ${
              theme === 'dark' ? 'text-zinc-300' : 'text-slate-500'
            }`}
          >
            <Clock size={12} className="text-red-500" />
            <span className="opacity-80">Last updated:</span>
            <span className="font-mono font-bold text-red-600 dark:text-red-400">
              {simulationTime || lastUpdated}
            </span>
          </div>

          {subtitle && (
            <>
              <span className={theme === 'dark' ? 'text-zinc-600' : 'text-slate-300'}>•</span>
              <span className={theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}>{subtitle}</span>
            </>
          )}
        </div>
      </div>

      {/* Scenario & Data Source Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveRoute('scenarios')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#141520] hover:bg-[#1a1c2b] border-white/10 text-zinc-200'
              : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
          }`}
        >
          <Database size={13} className="text-red-500" />
          <span className="opacity-70 font-normal">Scenario:</span>
          <span className="font-bold truncate max-w-[160px] text-red-500">
            {selectedScenario.name}
          </span>
        </button>

        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold tracking-wide uppercase border ${
            theme === 'dark'
              ? 'bg-red-950/40 border-red-800/50 text-red-400'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          <span>{dataSourceMode}</span>
        </div>
      </div>
    </div>
  );
};
