/**
 * caseStudyRunner.ts
 * ---------------------------------------------------------------------------
 * Runs one CaseStudy through CASCADE's EXISTING, unmodified engine pipeline:
 *
 *   documented contingency (case.initiatingContingency)
 *         v
 *   representative network (case.network — a plain Scenario)
 *         v
 *   propagationEngine.computeBaselineCascade      (existing, unchanged)
 *         v
 *   InterventionEngine.getCandidateActions /
 *   simulateActionWithEnvironment                 (existing, unchanged)
 *         v
 *   RecommendationEngine.evaluate                  (existing, unchanged)
 *         v
 *   VerificationEngine.runVerification              (existing, unchanged)
 *         v
 *   counterfactual result (DERIVED)
 *
 * Deliberately does NOT touch SensorGenerator/RiskCalculator: those inject
 * synthetic noise/dropout to emulate live telemetry, which would not be
 * honest for a documented historical/representative case. Interventions and
 * verification instead run directly against the case's ground-truth
 * modelled network — exactly how `computeBaselineCascade` already works,
 * and exactly why `InterventionEngine.simulateActionWithEnvironment` and
 * `VerificationEngine.runVerification` accept an optional `observation`.
 *
 * Every engine call here already clones internally (see
 * buildEnvironmentFromScenario / cloneEnvironment), so running a case never
 * mutates `case.network`, and each candidate intervention is evaluated
 * against its own independent environment — proven in
 * `__tests__/caseStudies.test.ts`.
 */

import { PropagationResult, Recommendation, SimulationResult, VerificationResult } from '../types/domain';
import { CaseStudy, DataClassification, EvidenceSource, ClassifiedStatement, InitiatingContingency } from './types';
import { computeBaselineCascade } from '../simulation/propagationEngine';
import { InterventionEngine } from '../simulation/interventionEngine';
import { RecommendationEngine } from '../simulation/recommendationEngine';
import { VerificationEngine } from '../simulation/verificationEngine';

export interface CaseStudyRunResult {
  caseId: string;
  caseName: string;
  domain: string;
  generatedAt: string;

  /**
   * Section 1: the real, cited incident/context. Nothing here is computed
   * by CASCADE — it is quoted/summarized from `evidence`. `classification`
   * reflects the WEAKEST tier actually present among `verifiedFacts` — if
   * even one fact rests on secondary extraction rather than a direct source
   * read, the whole section is labeled accordingly, so this never silently
   * upgrades an unconfirmed claim to VERIFIED.
   */
  realIncidentContext: {
    summary: string;
    observedMechanism: string;
    evidence: EvidenceSource[];
    verifiedFacts: ClassifiedStatement[];
    classification: 'VERIFIED' | 'UNCONFIRMED_SECONDARY_EXTRACTION';
  };

  /** Section 2: the representative network CASCADE actually ran against —
   * reconstructed because the real private topology is unavailable. */
  modelledNetwork: {
    nodeCount: number;
    edgeCount: number;
    initiatingContingency: InitiatingContingency;
    modeledAssumptions: ClassifiedStatement[];
    classification: 'MODELLED';
  };

  /** Section 3: CASCADE's own counterfactual calculation over the modelled
   * network above. Always a NEW result, never a historical measurement. */
  cascadeCounterfactual: {
    baseline: PropagationResult;
    interventions: SimulationResult[];
    recommendation: Recommendation;
    verification: VerificationResult;
    classification: 'DERIVED';
  };
}

/** Runs a single case study end-to-end through the existing engine. */
export function runCaseStudy(caseStudy: CaseStudy): CaseStudyRunResult {
  const { network } = caseStudy;

  // Baseline: what the documented contingency does if left unmitigated.
  const baseline = computeBaselineCascade(network);

  // Evaluate only the intervention types this case documents as applicable.
  const candidateActions = InterventionEngine.getCandidateActions(network).filter((action) =>
    caseStudy.availableInterventions.includes(action.type)
  );
  const interventions = candidateActions.map(
    (action) => InterventionEngine.simulateActionWithEnvironment(action, network).result
  );

  const recommendation = RecommendationEngine.evaluate(interventions, network);
  const chosenSim = interventions.find((s) => s.actionId === recommendation.actionId) ?? interventions[0];
  const verification = VerificationEngine.runVerification(recommendation, chosenSim, network, 10);

  // Never silently upgrade: if any verifiedFacts entry is only
  // UNCONFIRMED_SECONDARY_EXTRACTION, the whole section is labeled that way.
  const realIncidentClassification: 'VERIFIED' | 'UNCONFIRMED_SECONDARY_EXTRACTION' = caseStudy.verifiedFacts.some(
    (f) => f.classification === 'UNCONFIRMED_SECONDARY_EXTRACTION'
  )
    ? 'UNCONFIRMED_SECONDARY_EXTRACTION'
    : 'VERIFIED';

  return {
    caseId: caseStudy.id,
    caseName: caseStudy.name,
    domain: caseStudy.domain,
    generatedAt: new Date().toISOString(),
    realIncidentContext: {
      summary: caseStudy.realIncidentSummary,
      observedMechanism: caseStudy.expectedObservedMechanism,
      evidence: caseStudy.evidence,
      verifiedFacts: caseStudy.verifiedFacts,
      classification: realIncidentClassification,
    },
    modelledNetwork: {
      nodeCount: network.nodes.length,
      edgeCount: network.edges.length,
      initiatingContingency: caseStudy.initiatingContingency,
      modeledAssumptions: caseStudy.modeledAssumptions,
      classification: 'MODELLED',
    },
    cascadeCounterfactual: {
      baseline,
      interventions,
      recommendation,
      verification,
      classification: 'DERIVED',
    },
  };
}

/** Convenience for callers that only want the DERIVED classification for a
 * given result section, e.g. UI code deciding how to label a value. */
export function classifyResultSection(
  result: CaseStudyRunResult,
  section: 'realIncidentContext' | 'modelledNetwork' | 'cascadeCounterfactual'
): DataClassification {
  return result[section].classification;
}
