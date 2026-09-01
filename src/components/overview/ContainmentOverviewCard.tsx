import React from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { CheckCircle2 } from 'lucide-react';

export const ContainmentOverviewCard: React.FC = () => {
  const { verificationResult, theme } = useApp();

  const testsCount = verificationResult?.testsConducted || 10;
  const passedCount = verificationResult?.testsPassed ?? testsCount;
  const successRate = testsCount > 0 ? Math.round((passedCount / testsCount) * 100) : 100;

  const trials = Array.from({ length: testsCount }, (_, i) => ({
    index: i + 1,
    passed: i < passedCount,
  }));

  return (
    <NeonCard className="h-full min-h-[260px]" accentVariant="grey">
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-2 border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <h3 className="font-bold text-xs">Containment Probability</h3>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px] flex items-center gap-1">
          <CheckCircle2 size={11} /> {passedCount}/{testsCount} Runs Verified
        </span>
      </div>

      {/* Probability Display */}
      <div className="my-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-emerald-500">
            {successRate}%
          </span>
          <span className="text-xs opacity-60 font-semibold">Monte Carlo Confidence</span>
        </div>
        <p className="text-[11px] opacity-70 mt-1 leading-tight">
          Residual cascade risk is constrained within Substation A boundaries under current reroute policy.
        </p>
      </div>

      {/* 10 Monte Carlo Mini Tiles */}
      <div
        className={`p-2.5 rounded-xl border mt-2 ${
          theme === 'dark' ? 'bg-[#141520] border-white/10' : 'bg-slate-50 border-slate-100'
        }`}
      >
        <div className="flex justify-between items-center text-[9.5px] opacity-60 font-medium mb-1.5">
          <span>Stochastic Trial Breakdown</span>
          <span className="font-mono text-emerald-500 font-bold">
            {passedCount} PASS / {testsCount - passedCount} FAIL
          </span>
        </div>
        <div className="grid grid-cols-10 gap-1.5">
          {trials.map((t) => (
            <div
              key={t.index}
              className={`h-6 rounded-md text-[9px] font-bold flex items-center justify-center shadow-xs ${
                t.passed
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
              title={`Trial ${t.index}: ${t.passed ? 'Contained (PASS)' : 'Leakage (FAIL)'}`}
            >
              {t.passed ? '✓' : '✗'}
            </div>
          ))}
        </div>
      </div>
    </NeonCard>
  );
};
