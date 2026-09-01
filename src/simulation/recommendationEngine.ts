import { Recommendation, SimulationResult, Scenario } from '../types/domain';

export class RecommendationEngine {
  static evaluate(simulations: SimulationResult[], scenario: Scenario): Recommendation {
    // 1. Separate into effective and rejected alternatives
    const effectiveAlternatives = simulations.filter((s) => s.isEffective);
    const rejectedAlternatives = simulations.filter((s) => !s.isEffective);

    if (effectiveAlternatives.length === 0) {
      // Fallback if no actions contained cascade completely
      const leastDamaging = [...simulations].sort((a, b) => a.disruptionScore - b.disruptionScore)[0];
      return {
        actionId: leastDamaging.actionId,
        actionType: leastDamaging.actionType,
        title: leastDamaging.title,
        reason: 'No candidate action achieved 100% containment; selected action produces lowest aggregate harm.',
        disruptionScore: leastDamaging.disruptionScore,
        containmentPercentage: leastDamaging.containmentRate,
        populationImpact: leastDamaging.populationImpact,
        criticalFacilityImpact: leastDamaging.criticalFacilitiesImpact,
        confidencePercentage: 85,
        effectiveAlternatives: [],
        rejectedAlternatives,
        explanationSummary: `Emergency mitigation: ${leastDamaging.title} minimizes population exposure.`,
        auditTrail: {
          scenarioId: scenario.id,
          evaluatedAt: new Date().toLocaleTimeString(),
          evaluatedActionsCount: simulations.length,
          decisionRule: 'Min-Disruption Fallback Filter',
        },
      };
    }

    // 2. Select the effective alternative with the LOWEST disruption score
    const bestAction = [...effectiveAlternatives].sort((a, b) => a.disruptionScore - b.disruptionScore)[0];

    const rejectedSummary = rejectedAlternatives.map((r) => `${r.title} (${r.details.rationale})`).join('; ');

    const explanationSummary = `${bestAction.title.toUpperCase()} is recommended because it contains the modeled cascade while minimizing aggregate disruption (Disruption Score: ${bestAction.disruptionScore} vs ${effectiveAlternatives.map(e => `${e.title}: ${e.disruptionScore}`).join(', ')}).`;

    return {
      actionId: bestAction.actionId,
      actionType: bestAction.actionType,
      title: bestAction.title,
      reason: 'Lowest disruption among effective interventions.',
      disruptionScore: bestAction.disruptionScore,
      containmentPercentage: bestAction.containmentRate,
      populationImpact: bestAction.populationImpact,
      criticalFacilityImpact: bestAction.criticalFacilitiesImpact,
      confidencePercentage: 94,
      effectiveAlternatives,
      rejectedAlternatives,
      explanationSummary,
      auditTrail: {
        scenarioId: scenario.id,
        evaluatedAt: new Date().toLocaleTimeString(),
        evaluatedActionsCount: simulations.length,
        decisionRule: 'Deterministic Simulator-Optimal Effective Action Selection',
      },
    };
  }
}
