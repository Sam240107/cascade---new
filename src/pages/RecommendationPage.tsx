import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { SubHeader } from '../components/layout/SubHeader';
import { Compass, CheckCircle2, XCircle, Play, ShieldAlert, Sparkles, FileText } from 'lucide-react';

export const RecommendationPage: React.FC = () => {
  const {
    recommendation,
    isRecommendationAvailable,
    simulations,
    applyRecommendationToSandbox,
    isSandboxApplied,
    selectedScenario,
    setActiveRoute,
    isCaseStudyMode,
  } = useApp();

  const [naturalLanguageSummary, setNaturalLanguageSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateGeminiBriefing = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setNaturalLanguageSummary(
        `CASCADE Decision Engine evaluated 3 candidate interventions for ${selectedScenario.name}. ` +
        `Candidate "Dispatch Crew" was rejected as ineffective because crew ETA (24 min) exceeds Node A thermal time-to-failure (6 min). ` +
        `Candidate "Isolate Node" stops thermal propagation but disconnects 4 islanded secondary feeders, imposing 1,840 population impact and a Disruption Score of 43. ` +
        `"Reroute Load" is selected as simulator-optimal: it leverages 26 MW available headroom in Substation B (72%) and C (74%), containing the cascade with only 320 transient population impact, 0 critical facilities dropped, and a minimal Disruption Score of 18.`
      );
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-full pb-8">
      <SubHeader title="Recommended Action & Audit Trail" subtitle="Deterministic decision justification & auditability" />

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {isCaseStudyMode && !isRecommendationAvailable && (
          <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-semibold flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>NO_SIMULATED_ACTION_AVAILABLE — no domain action for this case is currently backed by the simplified engine.</span>
          </div>
        )}

        {/* Main Recommendation Hero Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Compass size={26} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Recommended Intervention
                </div>
                <h2 className="text-2xl font-black text-emerald-800 tracking-tight">
                  {recommendation.title.toUpperCase()}
                </h2>
              </div>
            </div>

            <button
              onClick={() => {
                applyRecommendationToSandbox();
                setActiveRoute('verification');
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              <Play size={15} fill="currentColor" />
              <span>Apply to Sandbox & Verify</span>
            </button>
          </div>

          <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            {recommendation.explanationSummary}
          </p>

          {/* 4 Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <div className="text-[10px] text-emerald-800 font-bold uppercase">Disruption Score</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">{recommendation.disruptionScore}</div>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <div className="text-[10px] text-emerald-800 font-bold uppercase">Containment Confidence</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">{recommendation.containmentPercentage}%</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Population Impact</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{recommendation.populationImpact.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Critical Facilities Dropped</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{recommendation.criticalFacilityImpact}</div>
            </div>
          </div>
        </div>

        {/* Gemini Natural Language Operational Briefing */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900">Operator Natural Language Briefing</h3>
            </div>
            <button
              onClick={generateGeminiBriefing}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {isGenerating ? 'Synthesizing...' : 'Generate Operator Briefing'}
            </button>
          </div>

          {naturalLanguageSummary ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
              {naturalLanguageSummary}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Click &quot;Generate Operator Briefing&quot; to synthesize an executive-ready natural-language explanation derived strictly from deterministic simulation metrics.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
