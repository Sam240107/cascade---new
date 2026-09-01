import React from 'react';
import { useApp } from '../../state/AppContext';
import { X, CheckCircle2, XCircle, ShieldAlert, GitBranch, ArrowRight } from 'lucide-react';

export const WhyActionModal: React.FC = () => {
  const {
    isWhyActionModalOpen,
    setIsWhyActionModalOpen,
    recommendation,
    simulations,
    activeEvent,
    selectedScenario,
    simulationTime,
    theme,
  } = useApp();

  if (!isWhyActionModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`rounded-2xl shadow-2xl border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto transition-colors ${
          theme === 'dark'
            ? 'bg-[#0f1018] border-white/15 text-white shadow-black/90'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-4 border-b mb-4 ${
            theme === 'dark' ? 'border-white/10' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center text-red-500 ${
                theme === 'dark' ? 'bg-red-950/40 border-red-800/50' : 'bg-red-50 border-red-200'
              }`}
            >
              <GitBranch size={20} />
            </div>
            <div>
              <h2 className="text-base font-black">
                Decision Rationale & Audit Trail
              </h2>
              <p className="text-xs opacity-60">
                Why was <span className="font-bold text-emerald-500">{recommendation.title}</span> selected?
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWhyActionModalOpen(false)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              theme === 'dark' ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Audit Trail Workflow Steps */}
        <div className="space-y-4 text-xs">
          {/* Step 1: Active Trigger */}
          <div
            className={`p-3 rounded-xl border ${
              theme === 'dark' ? 'bg-[#141522] border-white/10' : 'bg-slate-50 border-slate-200/70'
            }`}
          >
            <div className="font-bold opacity-60 text-[11px] uppercase tracking-wider mb-1">
              1. Observed Trigger Event
            </div>
            <p className="opacity-80">
              <span className="font-bold text-red-500">{activeEvent.name}</span> detected on {selectedScenario.name} at {simulationTime}. Stress reached {activeEvent.currentObservedValue}% with estimated Time to Failure of 6 minutes.
            </p>
          </div>

          {/* Step 2: Evaluation of All Candidates */}
          <div
            className={`p-3 rounded-xl border ${
              theme === 'dark' ? 'bg-[#141522] border-white/10' : 'bg-slate-50 border-slate-200/70'
            }`}
          >
            <div className="font-bold opacity-60 text-[11px] uppercase tracking-wider mb-2">
              2. Candidate Action Counterfactual Simulations
            </div>
            <div className="space-y-2">
              {simulations.map((sim) => (
                <div
                  key={sim.actionId}
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    sim.actionId === recommendation.actionId
                      ? theme === 'dark'
                        ? 'border-emerald-500/50 bg-emerald-950/20'
                        : 'border-emerald-300 bg-emerald-50/60'
                      : theme === 'dark'
                      ? 'border-white/5 bg-[#0a0b10]'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {sim.isEffective ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">{sim.title}</div>
                      <div className="text-[10.5px] opacity-70">{sim.description}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-500">{sim.containmentRate}% Contained</div>
                    <div className="text-[10px] opacity-50 font-mono">Disruption: {sim.disruptionScore}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Formal Recommendation */}
          <div
            className={`p-3.5 rounded-xl border ${
              theme === 'dark' ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="font-black text-xs uppercase tracking-wide mb-1">
              3. Recommendation Rationale
            </div>
            <p className="leading-relaxed">
              {recommendation.reason}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsWhyActionModalOpen(false)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Dismiss Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
