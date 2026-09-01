/**
 * domainActions.ts
 * ---------------------------------------------------------------------------
 * Domain-aware intervention/action definitions for the Real-World Case Study
 * Layer (Phase 2).
 *
 * ARCHITECTURE: this is intentionally a flat, DATA-DRIVEN table, not a set of
 * `if (domain === 'POWER_GRID') ... else if (...) ...` branches. Adding a new
 * domain (MICROGRID, INDUSTRIAL_FACILITY, WATER_INFRASTRUCTURE, ...) means
 * pushing new `DomainAction` entries into `DOMAIN_ACTIONS` — nothing else in
 * this file, `caseStudyRunner.ts`, or (most importantly) the core
 * propagation/intervention/verification engine needs to change. See
 * `__tests__/domainActions.test.ts` ("a future domain...") for a test that
 * proves this by exercising a domain this file has never seen.
 *
 * HONESTY CONTRACT: CASCADE's propagation engine (`propagationEngine.ts`,
 * unmodified) is a simplified node/edge load-threshold graph model — not an
 * AC/DC power-flow solver, not a UPS/ATS transfer-switch simulator, not a
 * protection-relay model. Every action below is explicitly tagged:
 *
 *   SUPPORTED_BY_CURRENT_ENGINE — genuinely runs through the EXISTING,
 *     unmodified reroute/isolate/crew mechanism in interventionEngine.ts
 *     (see `mechanism`). The resulting SimulationResult is real, DERIVED
 *     engine output — never fabricated.
 *
 *   REQUIRES_DOMAIN_SOLVER — a real, meaningful grid/facility/data-center
 *     action that the current simplified graph model cannot honestly
 *     represent (no upstream generation control, no per-workload criticality
 *     split beyond what a case's network already models, no distinct feed-
 *     switching logic, no repair-sequencing/time model). These NEVER produce
 *     a SimulationResult and can NEVER be recommended over a simulated
 *     action — see `runDomainActions` in `caseStudyRunner.ts`.
 *
 * Every SUPPORTED action targets the SAME node `InterventionEngine.
 * getCandidateActions()` already targets (the scenario's own initiating
 * event node) — this file does not invent new targeting behavior, because a
 * single isolated `simulateIsolate`/`simulateReroute`/`simulateCrew` call can
 * only honestly evaluate the node it is actually run against; composing
 * "isolate node X to help node Y" is exactly the kind of thing that would
 * require a real solver and is deliberately NOT attempted here.
 */

import { InterventionType } from '../types/domain';
import { CaseStudyDomain } from './types';

export type EngineSupport = 'SUPPORTED_BY_CURRENT_ENGINE' | 'REQUIRES_DOMAIN_SOLVER';
export type ActionRisk = 'low' | 'moderate' | 'high';

export interface DomainAction {
  id: string;
  name: string;
  domain: CaseStudyDomain;
  description: string;
  category: string;
  engineSupport: EngineSupport;
  prerequisites: string[];
  risk: ActionRisk;
  /** True iff engineSupport === 'SUPPORTED_BY_CURRENT_ENGINE'. Stored (not
   * just derivable) because the spec asks each action to explicitly
   * describe "whether it can be simulated now" — kept consistent with
   * `engineSupport` by construction, see `defineAction` below. */
  canSimulateNow: boolean;
  /** True iff engineSupport === 'REQUIRES_DOMAIN_SOLVER'. */
  requiresFutureDomainSolver: boolean;
  /**
   * Which of the existing, unmodified interventionEngine.ts mechanisms
   * (reroute/isolate/crew) this action is represented by. Present iff
   * engineSupport === 'SUPPORTED_BY_CURRENT_ENGINE'.
   */
  mechanism?: InterventionType;
  /** Honest, human-readable note on what the mapping does and doesn't
   * capture (or, for unsupported actions, what a real solver would need). */
  engineSupportNote: string;
}

/** Constructs a DomainAction, deriving canSimulateNow/requiresFutureDomainSolver
 * from engineSupport so the two can never drift out of sync. */
function defineAction(a: Omit<DomainAction, 'canSimulateNow' | 'requiresFutureDomainSolver'>): DomainAction {
  return {
    ...a,
    canSimulateNow: a.engineSupport === 'SUPPORTED_BY_CURRENT_ENGINE',
    requiresFutureDomainSolver: a.engineSupport === 'REQUIRES_DOMAIN_SOLVER',
  };
}

// ---------------------------------------------------------------------------
// POWER_GRID
// ---------------------------------------------------------------------------
const POWER_GRID_ACTIONS: DomainAction[] = [
  defineAction({
    id: 'network-reconfiguration',
    name: 'Network Reconfiguration',
    domain: 'POWER_GRID',
    description: 'Change the network topology/power path to move flow away from a stressed element.',
    category: 'topology',
    engineSupport: 'SUPPORTED_BY_CURRENT_ENGINE',
    mechanism: 'reroute',
    prerequisites: ['Alternate transmission paths with real spare capacity must exist downstream of the stressed element.'],
    risk: 'low',
    engineSupportNote:
      'Runs through the existing reroute mechanism: sheds the stressed node\'s excess load onto its actual downstream ' +
      'topology, capped by each neighbor\'s real spare capacity. This is a genuine, if simplified, representation of ' +
      'proactive load-flow reconfiguration.',
  }),
  defineAction({
    id: 'generation-redispatch',
    name: 'Generation Redispatch',
    domain: 'POWER_GRID',
    description: 'Reduce generation at a constrained location and/or increase generation elsewhere where the modeled network permits.',
    category: 'generation',
    engineSupport: 'REQUIRES_DOMAIN_SOLVER',
    prerequisites: ['Dispatchable generation headroom elsewhere on the grid.', 'A power-flow model relating generation changes to corridor loading.'],
    risk: 'moderate',
    engineSupportNote:
      'The current engine has no concept of an upstream generation source independent from downstream load — its ' +
      'reroute/isolate/crew mechanisms only ever act on the single target node they are invoked against and its own ' +
      'downstream edges, never on an upstream generator feeding into it. Representing "reduce output at the wind ' +
      'cluster" honestly would require a real power-flow/dispatch solver.',
  }),
  defineAction({
    id: 'renewable-curtailment',
    name: 'Renewable Curtailment',
    domain: 'POWER_GRID',
    description: 'Intentionally reduce renewable generation to relieve transmission stress.',
    category: 'generation',
    engineSupport: 'REQUIRES_DOMAIN_SOLVER',
    prerequisites: ['Curtailment/tripping authority over the connected renewable generation.', 'A model that reduces generator output without also disconnecting it.'],
    risk: 'moderate',
    engineSupportNote:
      'A full-isolation proxy (severing the corridor node, the same way Network Reconfiguration\'s neighboring ' +
      'mechanism does) was considered and explicitly tested — it produces 9/9 nodes failing (WORSE than the 8/9 ' +
      'baseline), because the engine\'s isolate mechanism strands the wind-generation node itself along with the ' +
      'rest of the network, which no real curtailment action would do (curtailment reduces output; it does not sever ' +
      'the generator\'s connection). That result would misrepresent curtailment as actively harmful rather than ' +
      'protective, so this mapping was rejected rather than shipped as a shaky approximation. A graduated reduction ' +
      'in generator output requires a domain-specific solver.',
  }),
  defineAction({
    id: 'controlled-load-shedding',
    name: 'Controlled Load Shedding',
    domain: 'POWER_GRID',
    description: 'Disconnect selected non-critical load to prevent wider cascading failure.',
    category: 'load-management',
    engineSupport: 'REQUIRES_DOMAIN_SOLVER',
    prerequisites: ['Switching authority over specific non-critical downstream load points.', 'A model relating shed downstream load back to upstream corridor stress.'],
    risk: 'moderate',
    engineSupportNote:
      'Isolating an arbitrary downstream 230kV area (rather than the corridor node itself) would only evaluate ' +
      'stranding consequences of THAT node in isolation — it does not, and cannot with the current engine, also ' +
      're-check whether the corridor\'s own separate overload was thereby relieved, since a single isolate/reroute/ ' +
      'crew call only ever runs the cascade from the one node it targets. Composing "shed load at X to help Y" ' +
      'honestly needs a real network solver, not two independent one-node simulations presented as if linked.',
  }),
  defineAction({
    id: 'restoration',
    name: 'Restoration',
    domain: 'POWER_GRID',
    description: 'Wait for/assume restoration of the unavailable element where appropriate.',
    category: 'restoration',
    engineSupport: 'SUPPORTED_BY_CURRENT_ENGINE',
    mechanism: 'crew',
    prerequisites: ['A credible estimate of restoration time (automatic reclosing, protection scheme action, or crew dispatch).'],
    risk: 'moderate',
    engineSupportNote:
      'Runs through the existing crew mechanism, which races a restoration ETA against the node\'s projected ' +
      'ground-truth time-to-failure. This is used here as a general "does restoration happen before the element ' +
      'fails" model — it does not distinguish an automatic protection action from an actual physical repair crew.',
  }),
];

// ---------------------------------------------------------------------------
// CRITICAL_FACILITY
// ---------------------------------------------------------------------------
const CRITICAL_FACILITY_ACTIONS: DomainAction[] = [
  defineAction({
    id: 'transfer-critical-load',
    name: 'Transfer Critical Load',
    domain: 'CRITICAL_FACILITY',
    description: 'Move critical services toward a protected/redundant supply path.',
    category: 'load-management',
    engineSupport: 'SUPPORTED_BY_CURRENT_ENGINE',
    mechanism: 'reroute',
    prerequisites: ['A protected/redundant supply path with real spare capacity must exist.'],
    risk: 'low',
    engineSupportNote:
      'Runs through the existing reroute mechanism, which sheds the failed feed\'s excess load across ALL of its ' +
      'real downstream paths proportionally (both the degraded and the protected generator here), capped by each ' +
      'path\'s actual spare capacity — a genuine, if not priority-aware, representation of load transfer.',
  }),
  defineAction({
    id: 'activate-alternate-feed',
    name: 'Activate Alternate Feed',
    domain: 'CRITICAL_FACILITY',
    description: 'Use an available alternate electrical path.',
    category: 'topology',
    engineSupport: 'REQUIRES_DOMAIN_SOLVER',
    prerequisites: ['A specific, switchable alternate feed distinct from the modeled proportional reroute paths.'],
    risk: 'moderate',
    engineSupportNote:
      'Conceptually distinct from Transfer Critical Load (a single, deliberate switch-over to one named feed, vs. ' +
      'proportional multi-path redistribution) — the current engine has no discrete feed-selection/switching logic, ' +
      'only the one generic capacity-capped shedding mechanism already used by Transfer Critical Load.',
  }),
  defineAction({
    id: 'backup-generation',
    name: 'Backup Generation',
    domain: 'CRITICAL_FACILITY',
    description: 'Use available backup generation.',
    category: 'power-supply',
    engineSupport: 'SUPPORTED_BY_CURRENT_ENGINE',
    mechanism: 'isolate',
    prerequisites: ['Backup generator capacity independent of the failed main feed.'],
    risk: 'moderate',
    engineSupportNote:
      'Runs through the existing isolate mechanism applied to the failed main feed: this severs the compromised ' +
      'grid connection and lets the topology itself determine which downstream paths keep functioning on existing ' +
      'backup capacity — a genuine representation of "cut the bad feed, rely on backup."',
  }),
  defineAction({
    id: 'shed-noncritical-load',
    name: 'Shed Non-Critical Load',
    domain: 'CRITICAL_FACILITY',
    description: 'Preserve critical-care services by reducing non-critical demand.',
    category: 'load-management',
    engineSupport: 'REQUIRES_DOMAIN_SOLVER',
    prerequisites: ['Switching authority over specific non-critical wards/circuits.', 'A model relating shed non-critical load back to the main feed\'s own overload state.'],
    risk: 'low',
    engineSupportNote:
      'Isolating the general-ward node directly would only evaluate stranding consequences of THAT node — it would ' +
      'not also re-check whether the main feed\'s own separate overload was relieved, for the same reason as ' +
      'Controlled Load Shedding in POWER_GRID: a single isolate call only evaluates the node it targets.',
  }),
  defineAction({
    id: 'restore-primary-supply',
    name: 'Restore Primary Supply',
    domain: 'CRITICAL_FACILITY',
    description: 'Restore normal supply when available.',
    category: 'restoration',
    engineSupport: 'SUPPORTED_BY_CURRENT_ENGINE',
    mechanism: 'crew',
    prerequisites: ['A credible estimate of repair/restoration time for the main feed.'],
    risk: 'moderate',
    engineSupportNote:
      'Runs through the existing crew mechanism, racing a repair-crew ETA against the feed\'s projected ground-truth ' +
      'time-to-failure — matches the documented real interim response (an alternate HT cable brought in within about an hour).',
  }),
];

// ---------------------------------------------------------------------------
// DATA_CENTER
// ---------------------------------------------------------------------------
const DATA_CENTER_ACTIONS: DomainAction[] = [
  defineAction({
    id: 'ups-transfer',
    name: 'UPS Transfer',
    domain: 'DATA_CENTER',
    description: 'Transfer load to an available redundant UPS/path.',
    category: 'power-supply',
    engineSupport: 'SUPPORTED_BY_CURRENT_ENGINE',
    mechanism: 'reroute',
    prerequisites: ['A redundant UPS path with real spare capacity relative to the transferred load.'],
    risk: 'moderate',
    engineSupportNote:
      'Runs through the existing reroute mechanism, which sheds the faulted primary UPS\'s excess load onto the ' +
      'backup UPS, capped by its real modeled spare capacity — this is precisely the documented real-world ' +
      'mechanism (and, honestly, the documented real-world failure mode when that capacity is insufficient).',
  }),
  defineAction({
    id: 'load-shedding',
    name: 'Load Shedding',
    domain: 'DATA_CENTER',
    description: 'Reduce non-critical IT load.',
    category: 'load-management',
    engineSupport: 'REQUIRES_DOMAIN_SOLVER',
    prerequisites: ['A distinct non-critical workload tier, separately modeled from the critical IT load.'],
    risk: 'low',
    engineSupportNote:
      'This case\'s modeled network does not split IT load into critical/non-critical tiers (only the documented ' +
      'mechanism — primary/backup UPS and one downstream IT load node — is modeled); inventing a non-critical load ' +
      'node not grounded in the cited source would be fabricating structure, not representing it. Marked as a ' +
      'future capability rather than approximated.',
  }),
  defineAction({
    id: 'workload-migration',
    name: 'Workload Migration',
    domain: 'DATA_CENTER',
    description: 'Move non-critical workloads away from the affected infrastructure.',
    category: 'load-management',
    engineSupport: 'REQUIRES_DOMAIN_SOLVER',
    prerequisites: ['A separate compute/power domain (e.g. another facility or availability zone) to migrate workloads to.'],
    risk: 'moderate',
    engineSupportNote:
      'Requires a more abstract load-transfer representation than the current single-network graph model provides — ' +
      'migrating a workload OUT of the modeled network entirely is not something the existing node/edge mechanisms represent.',
  }),
  defineAction({
    id: 'generator-takeover',
    name: 'Generator Takeover',
    domain: 'DATA_CENTER',
    description: 'Transfer the facility toward generator supply when available.',
    category: 'power-supply',
    engineSupport: 'SUPPORTED_BY_CURRENT_ENGINE',
    mechanism: 'isolate',
    prerequisites: ['Standby generator capacity independent of the faulted UPS path.'],
    risk: 'moderate',
    engineSupportNote:
      'Runs through the existing isolate mechanism applied to the faulted primary UPS: severs that path and lets ' +
      'the topology determine what continues to run on the remaining paths (including the standing generator ' +
      'contribution already modeled in this network).',
  }),
  defineAction({
    id: 'redundant-path-restoration',
    name: 'Redundant Path Restoration',
    domain: 'DATA_CENTER',
    description: 'Restore the unavailable power path.',
    category: 'restoration',
    engineSupport: 'SUPPORTED_BY_CURRENT_ENGINE',
    mechanism: 'crew',
    prerequisites: ['A credible estimate of repair/restoration time for the faulted UPS path.'],
    risk: 'moderate',
    engineSupportNote:
      'Runs through the existing crew mechanism, racing a repair ETA against the faulted UPS\'s projected ' +
      'ground-truth time-to-failure.',
  }),
];

/** Flat, data-driven registry — this array (not branching code) is what
 * makes the architecture extensible: adding a domain means adding entries
 * here, nothing else. */
export const DOMAIN_ACTIONS: DomainAction[] = [
  ...POWER_GRID_ACTIONS,
  ...CRITICAL_FACILITY_ACTIONS,
  ...DATA_CENTER_ACTIONS,
];

/** Returns every registered action for a given domain (any string — not
 * restricted to the three shipped domains, so a future domain's actions,
 * once registered, are returned the same way with no code changes here). */
export function getDomainActions(domain: CaseStudyDomain): DomainAction[] {
  return DOMAIN_ACTIONS.filter((a) => a.domain === domain);
}

/** Returns a single domain action by id, or undefined. */
export function getDomainAction(id: string): DomainAction | undefined {
  return DOMAIN_ACTIONS.find((a) => a.id === id);
}
