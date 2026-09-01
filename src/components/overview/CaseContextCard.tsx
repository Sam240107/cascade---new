import React from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { FileCheck, FileQuestion, Boxes, Cpu, AlertTriangle, ExternalLink } from 'lucide-react';

/**
 * Shown only when a real-world case study is active. Keeps the three
 * concepts the Phase 3 spec requires strictly separate — real evidence,
 * the representative modelled network, and CASCADE's own derived result —
 * each with its own classification badge, none of it computed here.
 */
export const CaseContextCard: React.FC = () => {
  const { theme, isCaseStudyMode, activeCaseStudy, caseStudyResult, domainActionResult, caseStudyError, observation } = useApp();

  if (!isCaseStudyMode || !activeCaseStudy) return null;

  const isVerified = caseStudyResult?.realIncidentContext.classification === 'VERIFIED';
  // The initiating node's ground-truth load/capacity — semantically labeled
  // (MW, not a raw "%"), matching the actual modelled units instead of the
  // sensor-layer's 0-100 stress-percentage convention.
  const initiatingNode = observation.nodes[activeCaseStudy.initiatingContingency.nodeId];
  const utilizationPct = initiatingNode ? Math.round(initiatingNode.stress * 1000) / 10 : null;
  // Prefer the domain-specific action name (Phase 2) over the generic
  // engine mechanism title (Phase 1) so this matches what the Simulation/
  // Recommendation pages show for the same recommendation.
  const recommendedName =
    domainActionResult?.recommendation.status === 'RECOMMENDED'
      ? domainActionResult.recommendation.chosenAction.name
      : caseStudyResult?.cascadeCounterfactual.recommendation.title;

  return (
    <NeonCard accentVariant="crimson" className="w-full">
      <div className={`flex items-center justify-between pb-3 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
        <div>
          <h3 className="font-black text-sm flex items-center gap-2">
            <Boxes size={16} className="text-rose-600" />
            <span>Case Study / Counterfactual Mode</span>
          </h3>
          <p className="text-[11px] opacity-60 mt-0.5">
            {activeCaseStudy.name} — {activeCaseStudy.domain} — {activeCaseStudy.location}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
            theme === 'dark' ? 'bg-red-950/40 border-red-800/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          Not Live Data
        </span>
      </div>

      {caseStudyError && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Simulation error</div>
            <div className="opacity-80">{caseStudyError}</div>
          </div>
        </div>
      )}

      {caseStudyResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {/* REAL-WORLD INCIDENT */}
          <div className={`p-3.5 rounded-xl border text-xs ${theme === 'dark' ? 'bg-[#11121c] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase tracking-wide mb-2 ${
                isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isVerified ? <FileCheck size={11} /> : <FileQuestion size={11} />}
              <span>{isVerified ? 'VERIFIED' : 'UNCONFIRMED — SECONDARY EXTRACTION'}</span>
            </div>
            <div className="font-bold text-[11px] uppercase tracking-wide opacity-60 mb-1">Real-World Incident</div>
            <p className="opacity-80 leading-relaxed line-clamp-5">{caseStudyResult.realIncidentContext.summary}</p>
            <div className="mt-2 flex flex-col gap-1">
              {caseStudyResult.realIncidentContext.evidence.map((ev) => (
                <a
                  key={ev.id}
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 hover:underline truncate"
                  title={ev.organization}
                >
                  <ExternalLink size={10} className="shrink-0" />
                  <span className="truncate">{ev.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* MODELLED NETWORK */}
          <div className={`p-3.5 rounded-xl border text-xs ${theme === 'dark' ? 'bg-[#11121c] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase tracking-wide mb-2 bg-slate-200 text-slate-700">
              <Boxes size={11} />
              <span>MODELLED</span>
            </div>
            <div className="font-bold text-[11px] uppercase tracking-wide opacity-60 mb-1">Modelled Network</div>
            <p className="opacity-80 leading-relaxed">
              Representative reconstruction — {caseStudyResult.modelledNetwork.nodeCount} nodes /{' '}
              {caseStudyResult.modelledNetwork.edgeCount} edges. Private topology is unavailable; this is not real
              measured infrastructure data.
            </p>
            <p className="mt-2 opacity-70 italic">{caseStudyResult.modelledNetwork.initiatingContingency.description}</p>
            {initiatingNode && (
              <div className="mt-2.5 pt-2 border-t border-current/10 grid grid-cols-3 gap-1.5 text-center">
                <div>
                  <div className="text-[9px] opacity-60 uppercase tracking-wide">Current Load</div>
                  <div className="font-bold text-[11px]">{Math.round(initiatingNode.observedLoad)} MW</div>
                </div>
                <div>
                  <div className="text-[9px] opacity-60 uppercase tracking-wide">Normal Capacity</div>
                  <div className="font-bold text-[11px]">{Math.round(initiatingNode.observedCapacity)} MW</div>
                </div>
                <div>
                  <div className="text-[9px] opacity-60 uppercase tracking-wide">Utilization</div>
                  <div className="font-bold text-[11px]">{utilizationPct}%</div>
                </div>
              </div>
            )}
          </div>

          {/* CASCADE RESULT */}
          <div className={`p-3.5 rounded-xl border text-xs ${theme === 'dark' ? 'bg-[#11121c] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase tracking-wide mb-2 bg-emerald-100 text-emerald-800">
              <Cpu size={11} />
              <span>DERIVED</span>
            </div>
            <div className="font-bold text-[11px] uppercase tracking-wide opacity-60 mb-1">CASCADE Result</div>
            <p className="opacity-80 leading-relaxed">
              Baseline: {caseStudyResult.cascadeCounterfactual.baseline.cascadeContained ? 'contained' : 'NOT contained'} (
              {caseStudyResult.cascadeCounterfactual.baseline.affectedNodeCount} nodes affected).
            </p>
            <p className="opacity-80 leading-relaxed mt-1">
              Recommended: <strong>{recommendedName ?? 'None (no supported action)'}</strong> — verification{' '}
              <strong>{caseStudyResult.cascadeCounterfactual.verification.status}</strong>.
            </p>
            <p className="mt-2 opacity-60 italic">Computed by the existing engine — never a historical measurement.</p>
          </div>
        </div>
      )}
    </NeonCard>
  );
};
