import React from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { getVerificationVerdict } from '../../caseStudies/verificationVerdict';
import { ShieldCheck, ShieldAlert, ShieldQuestion, ArrowRight } from 'lucide-react';

/**
 * Case-study Overview, section E — "Second-Shock Verification". Sourced
 * directly from `verificationResult` (already real/DERIVED for case-study
 * mode — see AppContext.tsx / VerificationEngine). The ROBUST / PARTIALLY
 * ROBUST / HIGH RESIDUAL VULNERABILITY verdict and the per-trial tiles use
 * the exact same shared logic as the full Verification page
 * (verificationVerdict.ts), so the two can never disagree.
 */
export const CaseVerificationCard: React.FC = () => {
  const { theme, verificationResult, setActiveRoute } = useApp();
  const verdict = getVerificationVerdict(verificationResult);
  const isPending = verificationResult.status === 'PENDING';

  const toneClasses = {
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/50' },
    amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/50' },
    rose: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800/50' },
  } as const;
  const tone = verdict ? toneClasses[verdict.tone] : toneClasses.amber;

  return (
    <NeonCard className="h-full min-h-[220px]" accentVariant={verdict?.tone === 'rose' ? 'crimson' : verdict?.tone === 'amber' ? 'amber' : 'emerald'}>
      <div className={`flex items-center justify-between pb-2.5 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
        <div>
          <h3 className="font-black text-sm">Second-Shock Verification</h3>
          <p className="text-[11px] opacity-60">Independent resilience test after the recommended fix</p>
        </div>
        <button
          onClick={() => setActiveRoute('verification')}
          className="text-[11px] font-bold text-red-500 hover:text-red-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
        >
          Details <ArrowRight size={12} />
        </button>
      </div>

      {isPending ? (
        <div className="flex items-center gap-2 mt-3 text-xs opacity-60">
          <ShieldQuestion size={16} />
          <span>{verificationResult.details}</span>
        </div>
      ) : (
        <>
          <div className={`flex items-center gap-3 mt-3 p-3 rounded-xl border ${tone.bg} ${tone.border}`}>
            {verdict?.tone === 'emerald' ? (
              <ShieldCheck size={26} className={tone.text} />
            ) : (
              <ShieldAlert size={26} className={tone.text} />
            )}
            <div>
              <div className={`text-lg font-black ${tone.text}`}>
                {verificationResult.testsPassed}/{verificationResult.testsConducted} independent shocks contained
              </div>
              <div className={`text-xs font-bold uppercase tracking-wide ${tone.text}`}>{verdict?.label}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-wrap mt-3">
            {Array.from({ length: verificationResult.testsConducted }).map((_, i) => {
              const trialPassed = i < verificationResult.testsPassed;
              return (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-md border text-[9px] font-bold flex items-center justify-center ${
                    trialPassed
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-rose-100 border-rose-300 text-rose-800'
                  }`}
                  title={trialPassed ? `Trial #${i + 1}: Passed (Contained)` : `Trial #${i + 1}: Failed (Not Contained)`}
                >
                  {trialPassed ? '✓' : '✕'}
                </div>
              );
            })}
          </div>
        </>
      )}
    </NeonCard>
  );
};
