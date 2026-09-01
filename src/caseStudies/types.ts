/**
 * Real-World Case Study Layer — types
 * ---------------------------------------------------------------------------
 * A CaseStudy packages a real, publicly documented incident or operational
 * context together with a REPRESENTATIVE network reconstruction (never the
 * facility's actual private topology, which CASCADE does not have access
 * to) that can be run through CASCADE's existing, UNMODIFIED propagation /
 * intervention / recommendation / verification engines.
 *
 * `network` reuses the existing `Scenario` type verbatim — the same type
 * `buildEnvironmentFromScenario()` already turns into a SimEnvironment of
 * SimNode/SimEdge for the propagation engine. Nothing here reimplements or
 * duplicates propagation, intervention, recommendation, or verification
 * logic; this layer only supplies grounded inputs and documentation for it.
 *
 * DATA INTEGRITY: every fact this layer carries is explicitly tagged with
 * one of three classifications (see `DataClassification`). Nothing here is
 * presented as a "live" sensor reading, and nothing here claims CASCADE
 * predicted or caused prevention of a real historical incident — CASCADE's
 * output is always a NEW counterfactual calculation over a MODELLED network,
 * clearly separate from the VERIFIED historical facts that motivated it.
 */

import { Scenario, InterventionType } from '../types/domain';

/**
 * Domains this layer ships with today. `CaseStudyDomain` below is
 * intentionally NOT restricted to this list — it accepts any string so new
 * domains (MICROGRID, INDUSTRIAL_FACILITY, WATER_NETWORK, ...) can be added
 * later purely as new case-study data, with no type changes required here.
 * `KNOWN_CASE_STUDY_DOMAINS` exists only to give known values autocomplete.
 */
export const KNOWN_CASE_STUDY_DOMAINS = ['POWER_GRID', 'CRITICAL_FACILITY', 'DATA_CENTER'] as const;
export type KnownCaseStudyDomain = (typeof KNOWN_CASE_STUDY_DOMAINS)[number];

/** Any of the known domains above, or any other string for a future domain. */
export type CaseStudyDomain = KnownCaseStudyDomain | (string & {});

/**
 * How a value/statement was obtained:
 *  - VERIFIED — the cited source's actual content was directly read this
 *               session (see `EvidenceSource.verificationMethod ===
 *               'direct-read'`) and confirmed to support the statement.
 *  - UNCONFIRMED_SECONDARY_EXTRACTION — the underlying document could not be
 *               directly rendered/read this session (e.g. a fetch/TLS
 *               failure, an unreadable scanned PDF); the statement instead
 *               rests on a search-engine's own snippet synthesis of that
 *               document. This is a materially weaker evidentiary tier than
 *               VERIFIED and MUST NOT be presented as independently
 *               confirmed — see `EvidenceSource.verificationMethod ===
 *               'secondary-extraction'`.
 *  - MODELLED — reconstructed for this demonstration because the real
 *               private topology/measurements are not publicly available
 *  - DERIVED  — calculated by CASCADE's engine from the modelled network;
 *               never a measured or historical value
 */
export type DataClassification = 'VERIFIED' | 'UNCONFIRMED_SECONDARY_EXTRACTION' | 'MODELLED' | 'DERIVED';

/** A single fact or assumption, tagged with how it was obtained. */
export interface ClassifiedStatement {
  statement: string;
  classification: DataClassification;
  /** ids into this case's `evidence[]`. Required in practice whenever
   * classification is VERIFIED or UNCONFIRMED_SECONDARY_EXTRACTION; omitted
   * for MODELLED statements since by definition no source documents them. */
  evidenceIds?: string[];
}

/** Public source citation backing one or more VERIFIED or
 * UNCONFIRMED_SECONDARY_EXTRACTION statements. */
export interface EvidenceSource {
  id: string;
  title: string;
  organization: string;
  url: string;
  /** Publication date, if known/stated by the source. */
  datePublished?: string;
  /** When this citation was checked against the live source. */
  dateAccessed: string;
  /** What specific fact(s) this source supports. */
  supports: string;
  /**
   * How this citation was actually checked this session:
   *  - 'direct-read' — the source's own content was fetched and read
   *    directly, and confirmed to contain what `supports` claims.
   *  - 'secondary-extraction' — the source document could not be directly
   *    rendered (fetch/TLS error, unreadable scanned PDF, etc.); the content
   *    attributed to it comes from a search engine's own synthesis, not a
   *    direct read. Any statement citing this evidence must be classified
   *    UNCONFIRMED_SECONDARY_EXTRACTION, never VERIFIED.
   */
  verificationMethod: 'direct-read' | 'secondary-extraction';
}

export interface InitiatingContingency {
  /** Must match `network.initialEvent.nodeId` (and a real id in `network.nodes`). */
  nodeId: string;
  description: string;
  classification: DataClassification;
}

export interface CaseStudy {
  id: string;
  name: string;
  domain: CaseStudyDomain;
  location: string;
  description: string;

  /** Plain-language summary of the real, documented incident/context. */
  realIncidentSummary: string;
  /** Narrative of the documented failure/operational mechanism — what is
   * actually reported to have happened, independent of CASCADE. */
  expectedObservedMechanism: string;

  evidence: EvidenceSource[];
  /** Statements classified VERIFIED — each should reference `evidence[].id`. */
  verifiedFacts: ClassifiedStatement[];
  /** Statements classified MODELLED — reconstructed inputs, and explicit
   * simplifications the propagation engine's node/edge model required. */
  modeledAssumptions: ClassifiedStatement[];

  /**
   * Representative network. This IS a plain `Scenario` — the same type any
   * other CASCADE scenario uses — so it flows through the existing engine
   * unchanged: `buildEnvironmentFromScenario(network)` produces the
   * SimEnvironment of SimNode/SimEdge that `simulateCascade` operates on.
   */
  network: Scenario;
  initiatingContingency: InitiatingContingency;

  /** Which of the engine's generic intervention types (reroute/isolate/
   * crew) are meaningful to evaluate for this case. The engine itself is
   * unchanged — this list only filters which of the three candidate
   * actions `getCandidateActions()` produces get run for this case.
   * Retained from Phase 1 for backward compatibility with `runCaseStudy()`;
   * Phase 2's richer domain-action layer (`domainActionIds` below) is the
   * preferred way to declare a case's available interventions going forward. */
  availableInterventions: InterventionType[];

  /**
   * ids into `domainActions.ts`'s `DOMAIN_ACTIONS` registry — the
   * domain-specific action set this case declares as relevant to it. All
   * ids must belong to actions whose `domain` matches this case's own
   * `domain`. See `runCaseStudyDomainActions()` in `caseStudyRunner.ts`.
   */
  domainActionIds: string[];

  /** Open questions this case is meant to explore via CASCADE's counterfactual. */
  counterfactualQuestions: string[];
}
