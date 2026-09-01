import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { SubHeader } from '../components/layout/SubHeader';
import { Zap, ShieldAlert, Sliders, Info, HelpCircle } from 'lucide-react';

export const RiskPage: React.FC = () => {
  const { riskScores, settings, updateSettings, setSelectedNodeId } = useApp();
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const filteredScores = riskScores.filter((item) => {
    if (filterLevel === 'all') return true;
    return item.level === filterLevel;
  });

  return (
    <div className="flex flex-col min-h-full pb-8">
      <SubHeader title="Risk Prediction & Blast Radius Analysis" subtitle="Interpretable vulnerability score & propagation modeling" />

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* Risk Formula Header Banner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">Deterministic Risk Formula:</span>
              <span className="font-mono bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200">
                RiskScore = w₁·Stress + w₂·(1/TTF) + w₃·RedundancyRisk + w₄·TransferExposure
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Weights configured for current evaluation mode: w₁={settings.weights.w1_stress}, w₂={settings.weights.w2_inverseTimeToFailure}, w₃={settings.weights.w3_redundancyRisk}, w₄={settings.weights.w4_loadTransferExposure}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {['all', 'critical', 'high', 'moderate', 'low'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1 rounded-lg capitalize transition-all ${
                  filterLevel === lvl ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Risk Breakdown Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-sm text-slate-900 mb-1">Ranked Node Risk Matrix</h3>
          <p className="text-xs text-slate-500 mb-4">Normalized score (0..1) with constituent factor contributions</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3 font-medium">Node</th>
                  <th className="py-2.5 px-3 font-medium">Type</th>
                  <th className="py-2.5 px-3 font-medium">Risk Score</th>
                  <th className="py-2.5 px-3 font-medium">Risk Level</th>
                  <th className="py-2.5 px-3 font-medium">TTF (Est.)</th>
                  <th className="py-2.5 px-3 font-medium">Blast Radius</th>
                  <th className="py-2.5 px-3 font-medium">Pop. Exposed</th>
                  <th className="py-2.5 px-3 font-medium">Stress Factor</th>
                  <th className="py-2.5 px-3 font-medium">Redundancy Factor</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScores.map((item) => (
                  <tr key={item.nodeId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">
                          {item.nodeId}
                        </span>
                        <span className="font-bold text-slate-900">{item.nodeName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 capitalize text-slate-600 font-medium">{item.nodeType}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">{item.score.toFixed(2)}</span>
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.score >= 0.75 ? 'bg-rose-600' : item.score >= 0.50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.round(item.score * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          item.level === 'critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.level === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : item.level === 'moderate'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {item.level}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">{item.timeToFailureMinutes} min</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{item.blastRadiusNodes} nodes</td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-800">{item.populationExposure.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{item.breakdown.stressContribution.toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{item.breakdown.redundancyContribution.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedNodeId(item.nodeId)}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        Select
                      </button>
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
