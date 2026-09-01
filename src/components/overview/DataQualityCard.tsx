import React from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { CheckCircle2, Wifi, Shield } from 'lucide-react';

export const DataQualityCard: React.FC = () => {
  const { observation, theme } = useApp();

  return (
    <NeonCard className="h-full min-h-[220px]" accentVariant="grey">
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-2 border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <h3 className="font-bold text-xs">Data Quality</h3>
        <Wifi size={13} className="text-emerald-500" />
      </div>

      <div className="my-2 text-center">
        <div className="text-3xl font-black text-emerald-500">
          {observation.overallDataQuality}%
        </div>
        <div className="text-[10px] opacity-60 font-semibold mt-0.5">Telemetry Integrity</div>
      </div>

      <div
        className={`p-2 rounded-xl border text-[10px] space-y-1 ${
          theme === 'dark' ? 'bg-[#141520] border-white/10' : 'bg-slate-50 border-slate-100'
        }`}
      >
        <div className="flex justify-between">
          <span className="opacity-60">Dropout Rate:</span>
          <span className="font-bold font-mono">0.05%</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-60">Staleness:</span>
          <span className="font-bold text-emerald-500">0.2s</span>
        </div>
      </div>
    </NeonCard>
  );
};
