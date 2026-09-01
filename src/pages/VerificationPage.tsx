import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { SubHeader } from '../components/layout/SubHeader';
import { ShieldCheck, ShieldAlert, Play, RefreshCw, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const {
    verificationResult,
    runVerification,
    isVerifying,
    recommendation,
    selectedScenario,
  } = useApp();

  const [testCount, setTestCount] = useState<number>(10);
  const isPassed = verificationResult.status === 'PASSED';

  return (
    <div className="flex flex-col min-h-full pb-8">
      <SubHeader title="Verification & Independent Perturbation Testing" subtitle="Don't execute a fix blind. Simulate it first — then prove it held." />

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* Verification Status Banner */}
        <div
          className={`rounded-2xl border p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            isPassed
              ? 'bg-emerald-50/50 border-emerald-200'
              : 'bg-rose-50/50 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isPassed
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              }`}
            >
              {isPassed ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Verification Status:
                </span>
                <span
                  className={`text-xl font-black ${
                    isPassed ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  {verificationResult.status}
                </span>
              </div>
              <p className="text-xs text-slate-750 font-medium mt-1">
                {verificationResult.details}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              {[10, 25, 50].map((count) => (
                <button
                  key={count}
                  onClick={() => setTestCount(count)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    testCount === count
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {count} Tests
                </button>
              ))}
            </div>

            <button
              onClick={() => runVerification(testCount)}
              disabled={isVerifying}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <RefreshCw size={14} className={isVerifying ? 'animate-spin' : ''} />
              <span>Run Stress Test</span>
            </button>
          </div>
        </div>

        {/* Independent Perturbation Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[10px] tracking-wider uppercase">
                INDEPENDENT PERTURBATION
              </span>
              <h3 className="font-bold text-sm text-slate-900">Dedicated Pseudo-Random Seed Stream</h3>
            </div>
            <span className="font-mono text-xs text-slate-500">Seed: #{verificationResult.independentPerturbation.seed}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Perturbation Type</div>
              <div className="font-bold text-slate-900 text-sm mt-1">
                {verificationResult.independentPerturbation.eventType}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Perturbation Target</div>
              <div className="font-bold text-slate-900 text-sm mt-1">
                {verificationResult.independentPerturbation.targetNodeName}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Shock Magnitude</div>
              <div className="font-bold text-rose-600 text-sm mt-1 font-mono">
                +{verificationResult.independentPerturbation.magnitude} MW
              </div>
            </div>
          </div>
        </div>

        {/* Monte Carlo Re-Cascade Evaluation Results */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-sm text-slate-900 mb-1">Monte Carlo Cascade Containment Runs</h3>
          <p className="text-xs text-slate-500 mb-4">
            Independent trial iterations with stochastic secondary power flows
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Tests Conducted</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{verificationResult.testsConducted}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Tests Passed</div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">{verificationResult.testsPassed}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Re-Cascade Rate</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{verificationResult.reCascadeRate}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Post-Fix Containment</div>
              <div className="text-xl font-bold text-emerald-700 mt-1 capitalize">{verificationResult.postFixContainment}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {Array.from({ length: verificationResult.testsConducted }).map((_, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-[10px] flex items-center justify-center"
                title={`Trial #${i + 1}: Passed (Contained)`}
              >
                ✓
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
