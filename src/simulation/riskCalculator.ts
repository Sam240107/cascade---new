import { Observation, RiskScore, RiskScoreWeights, Scenario } from '../types/domain';

export const DEFAULT_RISK_WEIGHTS: RiskScoreWeights = {
  w1_stress: 0.40,
  w2_inverseTimeToFailure: 0.25,
  w3_redundancyRisk: 0.15,
  w4_loadTransferExposure: 0.20,
};

export class RiskCalculator {
  static calculateRiskScores(
    observation: Observation,
    scenario: Scenario,
    weights: RiskScoreWeights = DEFAULT_RISK_WEIGHTS
  ): RiskScore[] {
    const results: RiskScore[] = [];

    for (const [nodeId, obsNode] of Object.entries(observation.nodes)) {
      const scenarioNode = scenario.nodes.find((n) => n.id === nodeId);
      const redundancy = scenarioNode ? scenarioNode.redundancyFactor : 0.5;

      // 1. Stress component (0..1)
      const stressComponent = Math.min(1.0, Math.max(0, obsNode.stress));

      // 2. Inverse time to failure component (0..1)
      // Faster failure (< 10 min) yields high urgency
      const ttf = obsNode.timeToFailureMinutes;
      const ttfComponent = ttf <= 60 ? Math.min(1.0, 15 / Math.max(1, ttf)) : 0.05;

      // 3. Redundancy Risk (lower redundancy = higher risk)
      const redundancyRisk = 1.0 - redundancy;

      // 4. Load Transfer Exposure (sum of downstream dependencies)
      const outgoingEdges = observation.edges.filter((e) => e.source === nodeId);
      const transferExposure = Math.min(
        1.0,
        outgoingEdges.reduce((sum, e) => sum + e.loadTransferRatio * e.secondaryEffectMultiplier, 0) / 1.5
      );

      // Raw weighted sum
      const rawScore =
        weights.w1_stress * stressComponent +
        weights.w2_inverseTimeToFailure * ttfComponent +
        weights.w3_redundancyRisk * redundancyRisk +
        weights.w4_loadTransferExposure * transferExposure;

      // Normalized score
      const score = Math.round(Math.min(1.0, Math.max(0, rawScore)) * 100) / 100;

      // Determine level
      let level: RiskScore['level'] = 'healthy';
      if (score >= 0.75) level = 'critical';
      else if (score >= 0.50) level = 'high';
      else if (score >= 0.30) level = 'moderate';
      else if (score >= 0.15) level = 'low';

      // Downstream blast radius calculation
      const downstreamIds = this.getDownstreamNodeIds(nodeId, observation);
      const affectedNodes = downstreamIds.length;
      let populationExposure = obsNode.populationWeight;
      let criticalFacilitiesCount = obsNode.critical ? 1 : 0;

      for (const dsId of downstreamIds) {
        const dsNode = observation.nodes[dsId];
        if (dsNode) {
          populationExposure += dsNode.populationWeight;
          if (dsNode.critical) criticalFacilitiesCount++;
        }
      }

      results.push({
        nodeId,
        nodeName: obsNode.name,
        nodeType: obsNode.type,
        score,
        level,
        confidence: obsNode.confidence,
        timeToFailureMinutes: obsNode.timeToFailureMinutes,
        blastRadiusNodes: affectedNodes,
        populationExposure,
        criticalFacilitiesCount,
        critical: obsNode.critical,
        breakdown: {
          stressContribution: Math.round(weights.w1_stress * stressComponent * 100) / 100,
          timeToFailureContribution: Math.round(weights.w2_inverseTimeToFailure * ttfComponent * 100) / 100,
          redundancyContribution: Math.round(weights.w3_redundancyRisk * redundancyRisk * 100) / 100,
          transferContribution: Math.round(weights.w4_loadTransferExposure * transferExposure * 100) / 100,
        },
      });
    }

    // Sort descending by score
    return results.sort((a, b) => b.score - a.score);
  }

  private static getDownstreamNodeIds(startNodeId: string, observation: Observation): string[] {
    const visited = new Set<string>();
    const queue: string[] = [startNodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const outgoing = observation.edges.filter((e) => e.source === current);
      for (const edge of outgoing) {
        if (!visited.has(edge.target) && edge.target !== startNodeId) {
          visited.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    return Array.from(visited);
  }
}
