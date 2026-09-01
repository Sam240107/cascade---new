import React from 'react';
import { useApp } from '../../state/AppContext';
import { CascadeLogo } from '../common/CascadeLogo';
import { Activity, Clock } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { selectedScenario, simulationTime, autoRefresh, setAutoRefresh, setActiveRoute, theme } = useApp();

  return (
    <footer
      className={`sticky bottom-0 z-10 px-6 py-2 flex flex-wrap items-center justify-between text-xs select-none transition-colors duration-300 border-t ${
        theme === 'dark'
          ? 'bg-[#08080c] border-white/10 text-zinc-400 shadow-lg'
          : 'bg-white border-slate-200 text-slate-500 shadow-xs'
      }`}
    >
      {/* Left: Active Scenario & Spider icon */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setActiveRoute('scenarios')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <CascadeLogo size={20} showText={false} />
          <span className="opacity-70 font-medium">Scenario</span>
          <span
            className={`font-bold transition-colors ${
              theme === 'dark'
                ? 'text-white group-hover:text-red-400'
                : 'text-slate-800 group-hover:text-red-600'
            }`}
          >
            {selectedScenario.name}
          </span>
        </div>
      </div>

      {/* Center: Simulation Time & Auto Refresh */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="opacity-70 font-medium flex items-center gap-1">
            <Clock size={12} className="text-red-500" />
            Simulation Time
          </span>
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded-md border text-red-600 dark:text-red-400 ${
              theme === 'dark'
                ? 'bg-[#141520] border-white/10'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            {simulationTime}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="opacity-70 font-medium">Auto Refresh</span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
              autoRefresh ? 'bg-red-600' : theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-300'
            }`}
            title="Toggle Continuous Sensor Stream"
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                autoRefresh ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Right: Local time & Version */}
      <div className="flex items-center gap-4 text-[11px] opacity-60">
        <span>All times synchronized to live engine clock</span>
        <span>•</span>
        <span className="font-semibold text-red-500">v1.2 Sentinel</span>
      </div>
    </footer>
  );
};
