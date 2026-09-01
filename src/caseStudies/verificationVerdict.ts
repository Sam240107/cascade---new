/**
 * verificationVerdict.ts
 * ---------------------------------------------------------------------------
 * Shared plain-English resilience verdict for a VerificationResult. Used by
 * both VerificationPage.tsx and the case-study Overview's verification
 * summary card, so the two never drift out of sync.
 *
 * Derived ENTIRELY from the engine's own already-computed
 * status/testsPassed/testsConducted fields — never a separate threshold
 * calculation — so it can never contradict VerificationResult.status.
 */

import { VerificationResult } from '../types/domain';

export type VerificationVerdictTone = 'emerald' | 'amber' | 'rose';

export interface VerificationVerdict {
  label: 'ROBUST' | 'PARTIALLY ROBUST' | 'HIGH RESIDUAL VULNERABILITY';
  tone: VerificationVerdictTone;
}

/** Returns null when there are no trials to interpret (e.g. PENDING). */
export function getVerificationVerdict(result: VerificationResult): VerificationVerdict | null {
  if (result.status === 'PENDING' || result.testsConducted === 0) return null;
  if (result.status === 'PASSED') return { label: 'ROBUST', tone: 'emerald' };
  if (result.testsPassed === 0) return { label: 'HIGH RESIDUAL VULNERABILITY', tone: 'rose' };
  return { label: 'PARTIALLY ROBUST', tone: 'amber' };
}
