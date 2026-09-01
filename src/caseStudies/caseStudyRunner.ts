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
import { DomainAction, getDomainActions } from './domainActions';

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

/**
 * Phase 2 — domain-aware action layer
 * ---------------------------------------------------------------------------
 * `runDomainActions` / `runCaseStudyDomainActions` sit ALONGSIDE `runCaseStudy`
 * above (which is left completely unchanged, so its existing tests/output
 * keep passing exactly as before) and give each case its own domain-specific
 * action set (see `domainActions.ts`) instead of the generic reroute/
 * isolate/crew labels.
 *
 * SUPPORTED_BY_CURRENT_ENGINE actions are simulated by picking the matching
 * candidate out of `InterventionEngine.getCandidateActions(network)` — the
 * SAME, unmodified 3-candidate list every other case uses, always targeting
 * the scenario's own initiating node — and running it through the SAME,
 * unmodified `simulateActionWithEnvironment`. Nothing here reimplements or
 * bypasses the engine.
 *
 * REQUIRES_DOMAIN_SOLVER actions are never simulated and never produce a
 * SimulationResult, so they structurally cannot enter
 * `RecommendationEngine.evaluate`'s input array — an unsupported action can
 * never be recommended over a simulated one, by construction rather than by
 * an extra check.
 */

export interface DomainActionResult {
  action: DomainAction;
  status: 'SIMULATED' | 'NOT_SIMULATED_REQUIRES_DOMAIN_SOLVER';
  /** Present iff status === 'SIMULATED'. Real, unmodified engine output. */
  simulation?: SimulationResult;
}

export type DomainActionRecommendation =
  | {
      status: 'RECOMMENDED';
      recommendation: Recommendation;
      chosenAction: DomainAction;
      baseline: PropagationResult;
      verification: VerificationResult;
      classification: 'DERIVED';
    }
  | { status: 'NO_SIMULATED_ACTION_AVAILABLE' };

export interface DomainActionCaseResult {
  caseId: string;
  domain: string;
  actions: DomainActionResult[];
  supportedActions: DomainActionResult[];
  futureActions: DomainActionResult[];
  recommendation: DomainActionRecommendation;
}

/**
 * Runs an explicit list of `DomainAction`s against a case study. Takes the
 * action list as a parameter (rather than looking it up internally) so a
 * caller — including a test exercising a domain this file has never seen —
 * can supply its own, without touching this module or the registry in
 * `domainActions.ts`. This is what makes "a future domain needs no core
 * engine change" checkable, not just asserted.
 */
export function runDomainActions(
  caseStudy: CaseStudy,
  actions: DomainAction[],
  verificationTestRunsCount: number = 10
): DomainActionCaseResult {
  const { network } = caseStudy;
  const baseline = computeBaselineCascade(network);

  // The existing, unmodified candidate list — always exactly reroute/
  // isolate/crew, always targeting the scenario's own initiating node.
  const candidateActions = InterventionEngine.getCandidateActions(network);

  const results: DomainActionResult[] = actions.map((action) => {
    if (action.engineSupport !== 'SUPPORTED_BY_CURRENT_ENGINE' || !action.mechanism) {
      return { action, status: 'NOT_SIMULATED_REQUIRES_DOMAIN_SOLVER' };
    }
    const matchingCandidate = candidateActions.find((c) => c.type === action.mechanism);
    if (!matchingCandidate) {
      // Defensive: the action claims engine support for a mechanism the
      // engine didn't actually generate for this scenario. Never fake a
      // result — fall back to "not simulated" rather than guessing.
      return { action, status: 'NOT_SIMULATED_REQUIRES_DOMAIN_SOLVER' };
    }
    const { result } = InterventionEngine.simulateActionWithEnvironment(matchingCandidate, network);
    return { action, status: 'SIMULATED', simulation: result };
  });

  const supportedActions = results.filter((r) => r.status === 'SIMULATED');
  const futureActions = results.filter((r) => r.status === 'NOT_SIMULATED_REQUIRES_DOMAIN_SOLVER');
  const simulations = supportedActions.map((r) => r.simulation!);

  if (simulations.length === 0) {
    return {
      caseId: caseStudy.id,
      domain: caseStudy.domain,
      actions: results,
      supportedActions,
      futureActions,
      recommendation: { status: 'NO_SIMULATED_ACTION_AVAILABLE' },
    };
  }

  const recommendation = RecommendationEngine.evaluate(simulations, network);
  const chosenResult = supportedActions.find((r) => r.simulation!.actionId === recommendation.actionId) ?? supportedActions[0];
  const verification = VerificationEngine.runVerification(recommendation, chosenResult.simulation!, network, verificationTestRunsCount);

  return {
    caseId: caseStudy.id,
    domain: caseStudy.domain,
    actions: results,
    supportedActions,
    futureActions,
    recommendation: {
      status: 'RECOMMENDED',
      recommendation,
      chosenAction: chosenResult.action,
      baseline,
      verification,
      classification: 'DERIVED',
    },
  };
}

/** Convenience: runs a case study's OWN declared domain action set (see
 * `CaseStudy.domainActionIds`), looked up from the shared registry. */
export function runCaseStudyDomainActions(caseStudy: CaseStudy, verificationTestRunsCount: number = 10): DomainActionCaseResult {
  const actions = getDomainActions(caseStudy.domain).filter((a) => caseStudy.domainActionIds.includes(a.id));
  return runDomainActions(caseStudy, actions, verificationTestRunsCount);
}
