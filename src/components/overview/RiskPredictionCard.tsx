import React from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { ChevronRight } from 'lucide-react';

export const RiskPredictionCard: React.FC = () => {
  const { riskScores, setActiveRoute, setSelectedNodeId, theme } = useApp();

  // Top 5 ranked risk nodes with null-safety
  const topNodes = (riskScores || []).slice(0, 5);

  // Helper to color risk bar
  const getRiskColor = (score: number) => {
    if (score >= 0.75) return 'bg-red-600';
    if (score >= 0.50) return 'bg-amber-500';
    if (score >= 0.30) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <NeonCard className="h-full min-h-[490px]" accentVariant="grey">
      {/* Card Header */}
      <div
        className={`flex items-center justify-between pb-3 border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <div>
          <h3 className="font-bold text-sm">
            Risk Prediction <span className="font-normal opacity-60">— Top Risk Nodes</span>
          </h3>
          <p className="text-[11px] opacity-60">Calculated multi-factor vulnerability score</p>
        </div>
      </div>

      {/* Clean Table Layout */}
      <div className="flex-1 overflow-x-auto my-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              className={`border-b text-[10.5px] font-semibold ${
                theme === 'dark' ? 'border-white/10 text-zinc-400' : 'border-slate-100 text-slate-400'
              }`}
            >
              <th className="py-2 px-1 font-medium">Node</th>
              <th className="py-2 px-1 font-medium">Risk Score</th>
              <th className="py-2 px-1 font-medium text-center">Blast</th>
              <th className="py-2 px-1 font-medium text-right">Population</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              theme === 'dark' ? 'divide-white/5' : 'divide-slate-100/80'
            }`}
          >
            {topNodes.map((item) => (
              <tr
                key={item.nodeId}
                onClick={() => setSelectedNodeId(item.nodeId)}
                className={`transition-colors cursor-pointer group ${
                  theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Node Identifier */}
                <td className="py-2.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full border font-bold flex items-center justify-center text-[10.5px] transition-colors shrink-0 ${
                        theme === 'dark'
                          ? 'bg-[#181924] border-white/15 text-white group-hover:border-red-400 group-hover:text-red-400'
                          : 'bg-slate-100 border-slate-200 text-slate-800 group-hover:border-red-300 group-hover:text-red-600'
                      }`}
                    >
                      {item.nodeId}
                    </span>
                    <span className="font-semibold truncate max-w-[85px] text-xs">
                      {item.nodeName}
                    </span>
                  </div>
                </td>

                {/* Risk Score + Bar */}
                <td className="py-2.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs w-7">
                      {(item.score ?? 0).toFixed(2)}
                    </span>
                    <div
                      className={`w-12 h-2 rounded-full overflow-hidden shrink-0 ${
                        theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-100'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${getRiskColor(item.score ?? 0)}`}
                        style={{ width: `${Math.round((item.score ?? 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Blast Radius */}
                <td className="py-2.5 px-1 text-center font-bold text-xs">
                  {item.blastRadiusNodes ?? 0}
                </td>

                {/* Population Exposure */}
                <td className="py-2.5 px-1 text-right font-mono font-medium text-xs">
                  {(item.populationExposure ?? 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Link */}
      <div
        className={`pt-2 border-t text-center ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <button
          onClick={() => setActiveRoute('risk')}
          className="text-xs font-bold text-red-500 hover:text-red-400 hover:underline inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          View Full Risk Ranking <ChevronRight size={13} />
        </button>
      </div>
    </NeonCard>
  );
};
