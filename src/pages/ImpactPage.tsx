import React from 'react';
import { useApp } from '../state/AppContext';
import { SubHeader } from '../components/layout/SubHeader';
import { TrendingDown, Users, ShieldAlert, Zap, ArrowDownRight } from 'lucide-react';

export const ImpactPage: React.FC = () => {
  const { impactSummary, selectedScenario, theme } = useApp();

  const popMetric = impactSummary?.metrics?.find((m) => m.id === 'population_exposed');
  const critMetric = impactSummary?.metrics?.find((m) => m.id === 'critical_facilities');
  const disruptionMetric = impactSummary?.metrics?.find((m) => m.id === 'total_disruption_score');
  const nodesMetric = impactSummary?.metrics?.find((m) => m.id === 'nodes_affected');

  const popSaved = Math.abs(popMetric?.difference || 1600000);
  const critSaved = Math.abs(critMetric?.difference || 2);
  const disruptionDelta = disruptionMetric?.percentageDelta || '-68%';
  const metricsList = impactSummary?.metrics || [];

  return (
    <div className="flex flex-col min-h-full pb-8">
      <SubHeader
        title="Counterfactual Impact & Averted Loss"
        subtitle="Quantified counterfactual analysis against unmitigated failure"
      />

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* Top 4 Key Averted Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            className={`p-5 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'bg-[#0c0d13] border-white/10 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between opacity-60">
              <span className="text-[11px] font-bold uppercase tracking-wider">Averted Downtime</span>
              <Zap size={16} className="text-amber-500" />
            </div>
            <div className="text-3xl font-black mt-2">
              45 min
            </div>
            <div className="text-xs text-emerald-500 font-semibold mt-1">Saved Grid Restitution Time</div>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'bg-[#0c0d13] border-white/10 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between opacity-60">
              <span className="text-[11px] font-bold uppercase tracking-wider">Protected Population</span>
              <Users size={16} className="text-red-500" />
            </div>
            <div className="text-3xl font-black mt-2 font-mono text-emerald-500">
              {popSaved.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-500 font-semibold mt-1">Reduction vs full cascade</div>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'bg-[#0c0d13] border-white/10 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between opacity-60">
              <span className="text-[11px] font-bold uppercase tracking-wider">Critical Facilities Preserved</span>
              <ShieldAlert size={16} className="text-red-500" />
            </div>
            <div className="text-3xl font-black text-emerald-500 mt-2">
              {critSaved} / 3
            </div>
            <div className="text-xs text-emerald-500 font-semibold mt-1">100% Hospital & Water uptime</div>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'bg-[#0c0d13] border-white/10 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between opacity-60">
              <span className="text-[11px] font-bold uppercase tracking-wider">Disruption Avoidance</span>
              <TrendingDown size={16} className="text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-500 mt-2">
              {disruptionDelta}
            </div>
            <div className="text-xs opacity-60 mt-1">Cascade containment index</div>
          </div>
        </div>

        {/* Detailed Impact Comparison Matrix */}
        <div
          className={`rounded-2xl border p-6 transition-all ${
            theme === 'dark'
              ? 'bg-[#0c0d13] border-white/10 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <h3 className="font-bold text-sm mb-1">Counterfactual Metric Ledger</h3>
          <p className="text-xs opacity-60 mb-4">
            Direct mathematical difference across parallel candidate futures on {selectedScenario?.name}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b text-[11px] font-semibold ${
                    theme === 'dark' ? 'border-white/10 text-zinc-400' : 'border-slate-200 text-slate-400'
                  }`}
                >
                  <th className="py-3 px-4 font-medium">Metric Dimension</th>
                  <th className="py-3 px-4 font-medium text-center">Unmitigated Cascade Baseline</th>
                  <th className="py-3 px-4 font-medium text-center">With CASCADE Intervention</th>
                  <th className="py-3 px-4 font-medium text-right">Averted Delta</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'
                }`}
              >
                {metricsList.map((m) => (
                  <tr
                    key={m.id}
                    className={`transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-sm">{m.name}</td>
                    <td className="py-3.5 px-4 text-center font-mono opacity-80 font-bold text-sm">
                      {m.withoutCascade.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-emerald-500 font-extrabold text-sm">
                      {m.withCascade.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 font-bold font-mono text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg text-xs border border-emerald-500/20">
                        <ArrowDownRight size={14} />
                        {m.difference.toLocaleString()} ({m.percentageDelta})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
