import React, { useState } from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { HelpCircle, Check, Play, Shield } from 'lucide-react';

export const RecommendedActionCard: React.FC = () => {
  const {
    recommendation,
    applyRecommendationToSandbox,
    isSandboxApplied,
    isVerifying,
    setIsWhyActionModalOpen,
    theme,
  } = useApp();

  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      applyRecommendationToSandbox();
      setIsExecuting(false);
    }, 450);
  };

  const critFacilities = recommendation?.criticalFacilityImpact ?? 0;

  return (
    <NeonCard className="h-full min-h-[300px]" accentVariant="grey">
      {/* Spider Web Background Motif */}
      <div className="absolute top-0 right-0 w-36 h-36 opacity-[0.08] pointer-events-none">
        <svg viewBox="0 0 100 100" fill="none" stroke="#ef4444" strokeWidth="1.5">
          <circle cx="100" cy="0" r="30" />
          <circle cx="100" cy="0" r="60" />
          <circle cx="100" cy="0" r="90" />
          <line x1="100" y1="0" x2="0" y2="100" />
          <line x1="100" y1="0" x2="30" y2="100" />
          <line x1="100" y1="0" x2="70" y2="100" />
        </svg>
      </div>

      <div>
        {/* Card Header with Spider Sentinel Icon */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center text-red-500 shadow-2xs ${
              theme === 'dark'
                ? 'bg-red-950/40 border-red-500/40'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <Shield size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold opacity-60 tracking-wider uppercase">
              Recommended Action
            </div>
            <div className="text-base font-extrabold text-emerald-500 leading-tight">
              {recommendation?.title ? recommendation.title.toUpperCase() : 'OPTIMAL MITIGATION'}
            </div>
          </div>
        </div>

        <p className="text-xs opacity-75 font-medium mb-3">
          {recommendation?.reason || 'Calculated dynamic reroute to isolate cascades.'}
        </p>

        {/* Key Metrics Grid */}
        <div
          className={`grid grid-cols-2 gap-2 p-3 rounded-xl border mb-4 text-xs ${
            theme === 'dark'
              ? 'bg-[#141520] border-white/10'
              : 'bg-slate-50/80 border-slate-100'
          }`}
        >
          <div>
            <div className="text-[10px] opacity-60 font-medium">Disruption Score</div>
            <div className="font-extrabold text-sm text-emerald-500">
              {recommendation?.disruptionScore ?? 0}
            </div>
          </div>
          <div>
            <div className="text-[10px] opacity-60 font-medium">Containment</div>
            <div className="font-extrabold text-sm text-emerald-500">
              {recommendation?.containmentPercentage ?? 100}%
            </div>
          </div>
          <div>
            <div className="text-[10px] opacity-60 font-medium">Population Impact</div>
            <div className="font-mono font-bold">
              {(recommendation?.populationImpact ?? 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] opacity-60 font-medium">Critical Facilities</div>
            <div className="font-bold text-emerald-500">
              {critFacilities === 0 ? '0 Affected' : `${critFacilities} At Risk`}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: Execute & Why this Action */}
      <div className="space-y-2 pt-2">
        <button
          onClick={handleExecute}
          disabled={isExecuting || isVerifying || isSandboxApplied}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all duration-150 shadow-md cursor-pointer ${
            isSandboxApplied
              ? 'bg-emerald-600 text-white cursor-default'
              : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white active:scale-98 shadow-red-600/30'
          }`}
        >
          {isSandboxApplied ? (
            <>
              <Check size={16} strokeWidth={3} />
              <span>APPLIED TO SANDBOX</span>
            </>
          ) : isExecuting ? (
            <span>SIMULATING DISPATCH...</span>
          ) : (
            <>
              <Play size={14} fill="currentColor" />
              <span>APPLY ACTION (SANDBOX)</span>
            </>
          )}
        </button>

        <button
          onClick={() => setIsWhyActionModalOpen(true)}
          className={`w-full py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#151622] hover:bg-[#1c1d2e] border-white/10 text-zinc-300'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <HelpCircle size={14} className="text-red-500" />
          <span>Why this action?</span>
        </button>
      </div>
    </NeonCard>
  );
};
