import React from 'react';
import { useApp } from '../state/AppContext';
import { SubHeader } from '../components/layout/SubHeader';
import { Network, ArrowRight, Play, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ScenariosPage: React.FC = () => {
  const {
    scenarios,
    selectedScenario,
    setSelectedScenarioId,
    setActiveRoute,
  } = useApp();

  return (
    <div className="flex flex-col min-h-full pb-8">
      <SubHeader title="Scenario Catalog & Grid Topologies" subtitle="Standardized stress scenarios and network topologies" />

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scenarios.map((sc) => {
            const isSelected = sc.id === selectedScenario.id;

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
                      setSelectedScenarioId(sc.id);
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
  );
};
