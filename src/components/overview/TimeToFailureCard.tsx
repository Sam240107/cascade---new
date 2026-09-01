import React from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { Clock, AlertTriangle, Zap } from 'lucide-react';

export const TimeToFailureCard: React.FC = () => {
  const { activeEvent, theme } = useApp();

  return (
    <NeonCard className="h-full min-h-[220px]" accentVariant="grey">
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-2 border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <h3 className="font-bold text-xs">Estimated Time to Failure</h3>
        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
      </div>

      <div className="my-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-red-600 dark:text-red-400">
            06:00
          </span>
          <span className="text-xs opacity-60 font-semibold">Minutes remaining</span>
        </div>
        <p className="text-[11px] opacity-70 mt-1 leading-tight">
          Thermal expansion rate on Substation A transformer bank will breach 100% capacity in ~360 seconds without load shift.
        </p>
      </div>

      {/* Progress buffer bar */}
      <div
        className={`p-2 rounded-xl border mt-1 ${
          theme === 'dark' ? 'bg-[#141520] border-white/10' : 'bg-slate-50 border-slate-100'
        }`}
      >
        <div className="flex justify-between text-[9.5px] opacity-60 mb-1">
          <span>Safe Buffer</span>
          <span className="text-red-500 font-bold">CRITICAL THRESHOLD</span>
        </div>
        <div
          className={`h-2 w-full rounded-full overflow-hidden ${
            theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'
          }`}
        >
          <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 w-[84%]" />
        </div>
      </div>
    </NeonCard>
  );
};
