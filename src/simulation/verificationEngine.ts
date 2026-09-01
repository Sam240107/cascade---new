/**
 * verificationEngine.ts
 * ---------------------------------------------------------------------------
 * Second-shock verification: takes the exact sandbox environment produced by
 * the recommended intervention, hits it with a fresh, independently-seeded
 * event (unrelated to the original cascade trigger), and runs it through the
 * real propagation engine to see whether the repaired network holds.
 *
 * PASS is only returned when the propagation engine reports zero new
 * failures across the qualifying share of independent trials — never a
 * hardcoded verdict.
 */

import { Recommendation, Scenario, VerificationResult, SimulationResult, Observation } from '../types/domain';
import { InterventionEngine } from './interventionEngine';
import { generateIndependentShock, applyIndependentShock } from './secondShockGenerator';

export class VerificationEngine {
  /**
   * `testRunsCount` keeps its original 4th-argument position (and default of
   * 10) for compatibility with existing callers. `observation` is optional
   * and trailing: when supplied, the post-fix sandbox environment is rebuilt
   * exactly as the recommended action produced it against the live sensor
   * observation; when omitted, it is rebuilt directly from the scenario's
   * ground truth (the action's own targetNodeId is trusted, since it always
   * originates from a real scenario node).
   */
  static runVerification(
    recommendation: Recommendation,
    simulationResult: SimulationResult,
    scenario: Scenario,
    testRunsCount: number = 10,
    observation?: Observation
  ): VerificationResult {
    const candidateActions = InterventionEngine.getCandidateActions(scenario);
    const chosenAction =
      candidateActions.find((a) => a.id === recommendation.actionId) ??
      candidateActions.find((a) => a.id === simulationResult.actionId) ??
      candidateActions[0];

    // Rebuild the exact post-fix sandbox state the recommended action produced.
    const { environment: postFixEnvironment } = InterventionEngine.simulateActionWithEnvironment(
      chosenAction,
      scenario,
      observation
    );

    // Independent verification seed stream — deliberately decoupled from the
    // scenario's own seed and the sensor seed, per trial.
    const baseSeed = (scenario.seed * 31337) ^ 0xcafe1234;

    let passedTests = 0;
    let primaryShock: ReturnType<typeof generateIndependentShock> = null;
    let primaryContained = false;
    let primaryAffected = { nodes: 0, population: 0, critical: 0 };
    let trialsRun = 0;

    for (let i = 0; i < testRunsCount; i++) {
      const trialSeed = (baseSeed ^ ((i + 1) * 0x9e3779b9)) >>> 0;
      const shock = generateIndependentShock(postFixEnvironment, trialSeed);
      if (!shock) continue; // nothing left standing to shock

      trialsRun++;
      const result = applyIndependentShock(postFixEnvironment, shock);
      const shockContained = result.failedNodes.length === 0;
      if (shockContained) passedTests++;

      if (i === 0) {
        primaryShock = shock;
        primaryContained = shockContained;
        primaryAffected = {
          nodes: result.affectedNodeCount,
          population: result.affectedPopulation,
          critical: result.affectedCriticalFacilities,
        };
      }
    }

    const testsConducted = trialsRun;
    const isPassed = testsConducted > 0 && passedTests >= Math.ceil(testsConducted * 0.8);
    const reCascadeCount = testsConducted - passedTests;
    const reCascadePercentage = testsConducted > 0 ? Math.round((reCascadeCount / testsConducted) * 100) : 100;

    return {
      status: isPassed ? 'PASSED' : 'FAILED',
      independentPerturbation: {
        eventType: 'Independent Secondary Stress Event',
        targetNodeId: primaryShock?.targetNodeId ?? 'N/A',
        targetNodeName: primaryShock?.targetNodeName ?? 'N/A',
        magnitude: primaryShock?.magnitude ?? 0,
        seed: primaryShock?.seed ?? baseSeed,
      },
      postFixContainment: primaryContained ? 'contained' : 'not contained',
      reCascadeRate: `${reCascadeCount} / ${testsConducted} (${reCascadePercentage}%)`,
      reCascadePercentage,
      testsConducted,
      testsPassed: passedTests,
      affectedNodesCount: primaryAffected.nodes,
      populationImpact: primaryAffected.population,
      criticalFacilities: primaryAffected.critical,
      details: isPassed
        ? 'The repaired network absorbed an independent secondary stress event without any new node exceeding its failure threshold.'
        : 'Warning: an independent secondary stress event still produced new failures after the recommended fix.',
      timestamp: new Date().toLocaleTimeString(),
    };
  }
}
