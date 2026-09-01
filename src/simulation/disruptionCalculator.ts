/**
 * disruptionCalculator.ts
 * ---------------------------------------------------------------------------
 * Single, centralized place for turning a propagation outcome into a
 * disruption score. Every intervention (and the baseline) runs its result
 * through this same function, so scores are always comparable and always
 * derived from the scenario's own population weights / critical flags —
 * never a per-action constant.
 *
 *   disruptionScore = populationComponent + downtimeComponent + criticalFacilityComponent
 */

import { DisruptionBreakdown, DisruptionWeights } from '../types/domain';

export const DEFAULT_DISRUPTION_WEIGHTS: DisruptionWeights = {
  populationWeightPerPerson: 0.01,
  downtimeWeightPerHour: 8,
  criticalFacilityPenalty: 25,
};

export function calculateDisruptionScore(
  populationImpact: number,
  downtimeHours: number,
  criticalFacilitiesImpact: number,
  weights: DisruptionWeights = DEFAULT_DISRUPTION_WEIGHTS
): DisruptionBreakdown {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const populationComponent = round2(Math.max(0, populationImpact) * weights.populationWeightPerPerson);
  const downtimeComponent = round2(Math.max(0, downtimeHours) * weights.downtimeWeightPerHour);
  const criticalFacilityComponent = round2(Math.max(0, criticalFacilitiesImpact) * weights.criticalFacilityPenalty);

  return {
    populationComponent,
    downtimeComponent,
    criticalFacilityComponent,
    totalDisruptionScore: round2(populationComponent + downtimeComponent + criticalFacilityComponent),
  };
}
