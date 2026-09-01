import React, { useState, useEffect } from 'react';
import { useApp } from '../state/AppContext';
import { SubHeader } from '../components/layout/SubHeader';
import { SimulationResult } from '../types/domain';
import { CheckCircle2, XCircle, Play, ShieldAlert, Layers, Lock } from 'lucide-react';

export const SimulationPage: React.FC = () => {
  const {
    simulations,
    selectedScenario,
    observation,
    applyRecommendationToSandbox,
    isSandboxApplied,
    setActiveRoute,
    isCaseStudyMode,
    futureDomainActions,
    recommendation,
    isRecommendationAvailable,
  } = useApp();

  // In case-study mode, default (and re-default on case switch) to the
  // actually recommended action rather than whichever candidate happens to
  // load first — candidate ordering/recommendation logic is untouched, this
  // only changes which tab is pre-selected when the page is viewed.
  const defaultActionId =
    isCaseStudyMode && isRecommendationAvailable && recommendation.actionId !== 'none'
      ? recommendation.actionId
      : simulations[0]?.actionId ?? 'act-reroute';

  const [selectedActionId, setSelectedActionId] = useState<string>(defaultActionId);

  useEffect(() => {
    setSelectedActionId(defaultActionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCaseStudyMode, isRecommendationAvailable, recommendation.actionId]);

  const activeSim = simulations.find((s) => s.actionId === selectedActionId) ?? simulations[0];

  return (
    <div className="flex flex-col min-h-full pb-8">
      <SubHeader title="Intervention Simulation Studio" subtitle="Counterfactual cascade branch evaluation & sandbox modeling" />

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* Empty state: no domain action for this case is currently simulatable */}
        {isCaseStudyMode && simulations.length === 0 && (
          <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-semibold flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>No supported action available for this case — see Future Domain-Solver Actions below.</span>
          </div>
        )}

        {/* Top 3 Candidate Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {simulations.map((sim, index) => {
            const isSelected = sim.actionId === selectedActionId;
            return (
              <div
                key={sim.actionId}
                onClick={() => setSelectedActionId(sim.actionId)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 font-bold text-xs flex items-center justify-center text-slate-800">
                      {index + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{sim.title}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                      sim.isEffective
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {sim.isEffective ? 'EFFECTIVE' : 'INEFFECTIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{sim.description}</p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400">Disruption: <strong className="text-slate-800">{sim.disruptionScore}</strong></span>
                  <span className="text-slate-400">Containment: <strong className={sim.isEffective ? 'text-emerald-700' : 'text-rose-600'}>{sim.containmentRate}%</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Future / Unsupported Domain Actions — named, never simulated, never recommended */}
        {isCaseStudyMode && futureDomainActions.length > 0 && (
          <div>
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lock size={13} className="text-slate-400" />
              Future Domain-Solver Actions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {futureDomainActions.map((r) => (
                <div
                  key={r.action.id}
                  className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 opacity-90"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-700">{r.action.name}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-200 text-slate-600 border border-slate-300">
                      REQUIRES DOMAIN-SPECIFIC SOLVER
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{r.action.description}</p>
                  <p className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500 line-clamp-3">
                    {r.action.engineSupportNote}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Candidate Deep Dive */}
        {activeSim && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-extrabold text-lg text-slate-900">{activeSim.title}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                      activeSim.isEffective
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {activeSim.isEffective ? 'Cascade Contained' : 'Cascade Breached Failure Limits'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{activeSim.details.rationale}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    applyRecommendationToSandbox();
                    setActiveRoute('verification');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Execute in Verification Sandbox</span>
                </button>
              </div>
            </div>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Disruption Score</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{activeSim.disruptionScore}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Containment Rate</div>
                <div className={`text-2xl font-extrabold mt-1 ${activeSim.isEffective ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {activeSim.containmentRate}%
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Population Impact</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{activeSim.populationImpact.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Critical Facilities</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{activeSim.criticalFacilitiesImpact}</div>
              </div>
            </div>

            {/* Stress Change Comparison Table */}
            <div>
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
                Node Stress Shift (Before vs After Intervention)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(activeSim.nodesStressAfter).map(([nodeId, rawStress]) => {
                  const stressAfter = Number(rawStress);
                  const beforeNode = observation.nodes[nodeId];
                  const beforeStress = beforeNode ? Math.round(beforeNode.stress * 100) : 50;
                  const delta = stressAfter - beforeStress;

                  return (
                    <div key={nodeId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900">Node {nodeId}</span>
                        <span
                          className={`font-bold font-mono text-[11px] ${
                            delta < 0 ? 'text-emerald-600' : delta > 0 ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        >
                          {delta > 0 ? `+${delta}%` : `${delta}%`}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                        <span>Before: {beforeStress}%</span>
                        <span className="font-bold text-slate-800">After: {stressAfter}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            stressAfter >= 90 ? 'bg-rose-600' : stressAfter >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, stressAfter)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
