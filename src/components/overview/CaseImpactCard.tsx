import React from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { Users, Building2, Layers, TrendingDown, Boxes } from 'lucide-react';

/**
 * Case-study Overview, section C — "Cascade Impact". Every number here comes
 * straight from `impactSummary` (already real/DERIVED for case-study mode —
 * see AppContext.tsx) and `caseStudyResult.cascadeCounterfactual.baseline`
 * (cascade depth, which isn't part of ImpactSummary). Nothing is computed
 * here; this only picks which already-derived numbers to show.
 */
export const CaseImpactCard: React.FC = () => {
  const { theme, impactSummary, caseStudyResult } = useApp();

  const nodesMetric = impactSummary?.metrics?.find((m) => m.id === 'nodes_affected');
  const popMetric = impactSummary?.metrics?.find((m) => m.id === 'population_exposed');
  const critMetric = impactSummary?.metrics?.find((m) => m.id === 'critical_facilities');
  const disruptionMetric = impactSummary?.metrics?.find((m) => m.id === 'total_disruption_score');
  const cascadeDepth = caseStudyResult?.cascadeCounterfactual.baseline.cascadeDepth;

  const stat = (
    label: string,
    icon: React.ReactNode,
    withCascade: number | undefined,
    withoutCascade: number | undefined,
    unit?: string
  ) => (
    <div
      className={`p-3.5 rounded-xl border ${theme === 'dark' ? 'bg-[#141520] border-white/10' : 'bg-slate-50 border-slate-100'}`}
    >
      <div className="flex items-center gap-1.5 opacity-60 text-[10px] mb-1.5 uppercase tracking-wide font-bold">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-black text-emerald-500">
        {withCascade ?? 0}
        {unit}
      </div>
      <div className="text-[10px] opacity-50 mt-0.5">
        vs {withoutCascade ?? 0}
        {unit} unmitigated
      </div>
    </div>
  );

  return (
    <NeonCard className="h-full min-h-[260px]" accentVariant="emerald">
      <div className={`flex items-center justify-between pb-2.5 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
        <div>
          <h3 className="font-black text-sm">Cascade Impact</h3>
          <p className="text-[11px] opacity-60">With the recommended action, vs. an unmitigated cascade</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        {stat('Nodes Affected', <Boxes size={12} className="text-emerald-500" />, nodesMetric?.withCascade, nodesMetric?.withoutCascade)}
        {stat('Population Exposed', <Users size={12} className="text-emerald-500" />, popMetric?.withCascade, popMetric?.withoutCascade)}
        {stat('Critical Facilities', <Building2 size={12} className="text-emerald-500" />, critMetric?.withCascade, critMetric?.withoutCascade)}
        {stat('Disruption Score', <TrendingDown size={12} className="text-emerald-500" />, disruptionMetric?.withCascade, disruptionMetric?.withoutCascade)}
      </div>

      {typeof cascadeDepth === 'number' && (
        <div
          className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between text-xs ${
            theme === 'dark' ? 'bg-[#141520] border-white/10' : 'bg-slate-50 border-slate-100'
          }`}
        >
          <span className="flex items-center gap-1.5 opacity-70">
            <Layers size={13} className="text-emerald-500" />
            Unmitigated cascade depth
          </span>
          <span className="font-bold">{cascadeDepth} hop{cascadeDepth === 1 ? '' : 's'}</span>
        </div>
      )}
    </NeonCard>
  );
};
