import React from 'react';
import { useApp } from '../state/AppContext';
import { SubHeader } from '../components/layout/SubHeader';
import { runCaseStudy } from '../caseStudies/caseStudyRunner';
import { Network, ArrowRight, Play, CheckCircle2, ShieldAlert, FileCheck, FileQuestion } from 'lucide-react';

export const ScenariosPage: React.FC = () => {
  const {
    scenarios,
    selectedScenario,
    loadScenario,
    setActiveRoute,
    caseStudies,
    selectedCaseStudyId,
    selectCaseStudy,
    isCaseStudyMode,
  } = useApp();

  return (
    <div className="flex flex-col min-h-full pb-8">
      <SubHeader title="Scenario Catalog & Grid Topologies" subtitle="Standardized stress scenarios and network topologies" />

      <div className="p-6 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* ===================== Real-World Case Studies ===================== */}
        <div>
          <h2 className="font-extrabold text-sm text-slate-900 mb-1">Real-World Case Studies</h2>
          <p className="text-xs text-slate-500 mb-4">
            Documented public incidents, reconstructed as representative networks and run through the same
            CASCADE engine as the synthetic scenarios below — see each case's evidence classification.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {caseStudies.map((cs) => {
              const isSelected = isCaseStudyMode && cs.id === selectedCaseStudyId;
              // Reuses the existing case-study runner (never recalculated
              // here) purely to read its already-computed evidence
              // classification for this preview card.
              const evidenceClassification = runCaseStudy(cs).realIncidentContext.classification;
              const isVerified = evidenceClassification === 'VERIFIED';

              return (
                <div
                  key={cs.id}
                  className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                    isSelected
                      ? 'bg-white border-rose-500 shadow-lg ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 font-mono font-bold text-xs text-slate-700">
                        {cs.domain}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                          <CheckCircle2 size={13} /> Active Case
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 mb-1">{cs.name}</h3>
                    <p className="text-xs text-slate-500 mb-1">{cs.location}</p>
                    <p className="text-xs text-slate-600 mb-4 line-clamp-4">{cs.realIncidentSummary}</p>

                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-extrabold uppercase tracking-wide mb-4 ${
                        isVerified
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}
                    >
                      {isVerified ? <FileCheck size={13} /> : <FileQuestion size={13} />}
                      <span>{isVerified ? 'VERIFIED' : 'UNCONFIRMED — SECONDARY EXTRACTION'}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        selectCaseStudy(cs.id);
                        setActiveRoute('overview');
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <span>{isSelected ? 'View Active Dashboard' : 'Load Case Study'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================== Predefined Synthetic Scenarios ===================== */}
        <div>
          <h2 className="font-extrabold text-sm text-slate-900 mb-1">Synthetic Stress Scenarios</h2>
          <p className="text-xs text-slate-500 mb-4">Standardized, fully synthetic network topologies for engine demonstration.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {scenarios.map((sc) => {
              const isSelected = !isCaseStudyMode && sc.id === selectedScenario.id;

              return (
                <div
                  key={sc.id}
                  className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                    isSelected
                      ? 'bg-white border-rose-500 shadow-lg ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 font-mono font-bold text-xs text-slate-700">
                        {sc.id}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 size={13} /> Active Scenario
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 mb-1">{sc.name}</h3>
                    <p className="text-xs text-slate-500 mb-4">{sc.description}</p>

                    <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Nodes</span>
                        <span className="font-bold text-slate-800">{sc.nodes.length} Nodes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Lines</span>
                        <span className="font-bold text-slate-800">{sc.edges.length} Interconnections</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Initial Trigger</span>
                        <span className="font-bold text-rose-600 truncate max-w-[150px]">{sc.initialEvent.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Seed</span>
                        <span className="font-mono text-slate-600 font-medium">{sc.seed}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        loadScenario(sc.id);
                        setActiveRoute('overview');
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <span>{isSelected ? 'View Active Dashboard' : 'Load Scenario'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
