import React from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { SimulationResult } from '../../types/domain';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export const InterventionCompareCard: React.FC = () => {
  const { simulations, setActiveRoute, theme } = useApp();

  const simList = simulations || [];

  // Color helper for stress bars
  const getStressBarColor = (val: number) => {
    if (val >= 90) return 'bg-red-600';
    if (val >= 70) return 'bg-orange-500';
    if (val >= 50) return 'bg-yellow-500';
    if (val >= 30) return 'bg-green-600';
    return theme === 'dark' ? 'bg-zinc-700' : 'bg-slate-300';
  };

  // Mini topology visual preview for each intervention
  const renderMiniTopology = (sim: SimulationResult) => {
    if (sim.actionType === 'reroute') {
      return (
        <svg viewBox="0 0 140 100" className="w-full h-24 my-1">
          <circle cx="70" cy="20" r="10" fill="#dc2626" opacity="0.8" />
          <text x="70" y="24" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">
            A
          </text>
          <circle cx="30" cy="50" r="8" fill="#ea580c" />
          <text x="30" y="53" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
            B
          </text>
          <circle cx="110" cy="50" r="8" fill="#ea580c" />
          <text x="110" y="53" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
            C
          </text>
          <circle cx="50" cy="85" r="8" fill="#16a34a" />
          <text x="50" y="88" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
            D
          </text>
          <circle cx="90" cy="85" r="8" fill="#16a34a" />
          <text x="90" y="88" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
            E
          </text>
          <line
            x1="62"
            y1="26"
            x2="38"
            y2="44"
            stroke="#16a34a"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
          <line
            x1="78"
            y1="26"
            x2="102"
            y2="44"
            stroke="#16a34a"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
          <line x1="30" y1="58" x2="46" y2="78" stroke="#16a34a" strokeWidth="1.5" />
          <line x1="110" y1="58" x2="94" y2="78" stroke="#16a34a" strokeWidth="1.5" />
        </svg>
      );
    }

    if (sim.actionType === 'isolate') {
      return (
        <svg viewBox="0 0 140 100" className="w-full h-24 my-1">
          <circle cx="70" cy="20" r="10" fill="#94a3b8" />
          <text x="70" y="24" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">
            A
          </text>
          <line x1="63" y1="13" x2="77" y2="27" stroke="#dc2626" strokeWidth="2.5" />
          <line x1="77" y1="13" x2="63" y2="27" stroke="#dc2626" strokeWidth="2.5" />
          <circle cx="30" cy="50" r="8" fill="#94a3b8" />
          <text x="30" y="53" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
            B
          </text>
          <circle cx="110" cy="50" r="8" fill="#94a3b8" />
          <text x="110" y="53" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
            C
          </text>
          <line
            x1="62"
            y1="26"
            x2="38"
            y2="44"
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <line
            x1="78"
            y1="26"
            x2="102"
            y2="44"
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        </svg>
      );
    }

    if (sim.actionType === 'crew') {
      return (
        <svg viewBox="0 0 140 100" className="w-full h-24 my-1">
          <circle cx="70" cy="20" r="10" fill="#f59e0b" />
          <text x="70" y="24" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">
            A
          </text>
          <circle cx="30" cy="50" r="8" fill="#16a34a" />
          <text x="30" y="53" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
            B
          </text>
          <circle cx="110" cy="50" r="8" fill="#16a34a" />
          <text x="110" y="53" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
            C
          </text>
          <line
            x1="62"
            y1="26"
            x2="38"
            y2="44"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          <line
            x1="78"
            y1="26"
            x2="102"
            y2="44"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 140 100" className="w-full h-24 my-1">
        <circle cx="70" cy="20" r="10" fill="#dc2626" />
        <text x="70" y="24" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">
          A
        </text>
        <circle cx="30" cy="50" r="8" fill="#dc2626" />
        <text x="30" y="53" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
          B
        </text>
        <circle cx="110" cy="50" r="8" fill="#dc2626" />
        <text x="110" y="53" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
          C
        </text>
        <line x1="62" y1="26" x2="38" y2="44" stroke="#dc2626" strokeWidth="2.5" />
        <line x1="78" y1="26" x2="102" y2="44" stroke="#dc2626" strokeWidth="2.5" />
      </svg>
    );
  };

  return (
    <NeonCard className="h-full min-h-[300px]" accentVariant="grey">
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-3 border-b mb-3 ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <div>
          <h3 className="font-bold text-sm">Intervention Simulation</h3>
          <p className="text-[11px] opacity-60">
            Counterfactual evaluation of candidate mitigation strategies
          </p>
        </div>
        <button
          onClick={() => setActiveRoute('simulation')}
          className="text-xs font-bold text-red-500 hover:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          Compare Full Suite <ArrowRight size={13} />
        </button>
      </div>

      {/* 4 Candidate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {simList.map((sim) => {
          const isOptimal = sim.actionId === 'act-reroute';

          return (
            <div
              key={sim.actionId}
              className={`relative rounded-xl border p-3 flex flex-col justify-between transition-all duration-200 ${
                isOptimal
                  ? theme === 'dark'
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/40'
                    : 'border-emerald-300 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-400/40'
                  : theme === 'dark'
                  ? 'border-white/10 bg-[#12131e]'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              {/* Top Row: Title & Containment Badge */}
              <div>
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-bold text-xs leading-tight">
                    {sim.title}
                  </span>
                  {sim.isEffective ? (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-black flex items-center gap-0.5">
                      <CheckCircle2 size={10} /> YES
                    </span>
                  ) : (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-black flex items-center gap-0.5">
                      <XCircle size={10} /> NO
                    </span>
                  )}
                </div>

                {/* Subtitle / Description */}
                <p className="text-[10px] opacity-70 line-clamp-2 min-h-[28px] mb-2 leading-tight">
                  {sim.description}
                </p>

                {/* Mini Topology Visual Preview */}
                <div
                  className={`rounded-lg border p-1 my-1.5 flex items-center justify-center ${
                    theme === 'dark'
                      ? 'bg-[#08080d] border-white/10'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {renderMiniTopology(sim)}
                </div>
              </div>

              {/* Stress After Distribution Mini Bar */}
              <div
                className={`pt-2 border-t mt-2 text-[10px] ${
                  theme === 'dark' ? 'border-white/10' : 'border-slate-200/60'
                }`}
              >
                <div className="flex justify-between items-center mb-1 text-[9.5px]">
                  <span className="opacity-60">Residual Stress</span>
                  <span className="font-mono font-bold text-emerald-500">
                    {sim.containmentRate}% Contained
                  </span>
                </div>
                <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden">
                  {Object.entries(sim.nodesStressAfter || {}).map(([nodeId, val]) => (
                    <div
                      key={nodeId}
                      className={`h-full flex-1 ${getStressBarColor(Number(val))}`}
                      title={`Node ${nodeId}: ${val}% stress`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </NeonCard>
  );
};
