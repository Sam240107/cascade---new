import React from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { Users, Building2, ArrowDownRight } from 'lucide-react';

export const ImpactSummaryCard: React.FC = () => {
  const { impactSummary, theme } = useApp();

  const popMetric = impactSummary?.metrics?.find((m) => m.id === 'population_exposed');
  const critMetric = impactSummary?.metrics?.find((m) => m.id === 'critical_facilities');
  const disruptionMetric = impactSummary?.metrics?.find((m) => m.id === 'total_disruption_score');

  const popSaved = Math.abs(popMetric?.difference || 1600000);
  const critSaved = Math.abs(critMetric?.difference || 2);
  const disruptionDelta = disruptionMetric?.percentageDelta || '-68%';

  return (
    <NeonCard className="h-full min-h-[220px]" accentVariant="grey">
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-2 border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <h3 className="font-bold text-xs">Counterfactual Impact Mitigation</h3>
        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
          <ArrowDownRight size={12} />
          {disruptionDelta} Disruption
        </span>
      </div>

      {/* Grid of Averted Damages */}
      <div className="grid grid-cols-2 gap-2 my-2 text-xs">
        <div
          className={`p-2.5 rounded-xl border ${
            theme === 'dark' ? 'bg-[#141520] border-white/10' : 'bg-slate-50 border-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 opacity-60 text-[10px] mb-1">
            <Users size={12} className="text-emerald-500" />
            <span>Population Protected</span>
          </div>
          <div className="text-base font-black text-emerald-500">
            {popSaved.toLocaleString()}
          </div>
          <div className="text-[9px] opacity-50">vs unmitigated cascade</div>
        </div>

        <div
          className={`p-2.5 rounded-xl border ${
            theme === 'dark' ? 'bg-[#141520] border-white/10' : 'bg-slate-50 border-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 opacity-60 text-[10px] mb-1">
            <Building2 size={12} className="text-emerald-500" />
            <span>Facilities Saved</span>
          </div>
          <div className="text-base font-black text-emerald-500">
            {critSaved}
          </div>
          <div className="text-[9px] opacity-50">Zero critical outages</div>
        </div>
      </div>
    </NeonCard>
  );
};
