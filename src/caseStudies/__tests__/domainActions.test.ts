/**
 * Tests for the Phase 2 domain-aware action layer.
 *
 * Run with: npm test
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { getCaseStudies, getCaseStudy } from '../registry';
import { runCaseStudy, runCaseStudyDomainActions, runDomainActions } from '../caseStudyRunner';
import { getDomainActions, DomainAction } from '../domainActions';
import { Scenario } from '../../types/domain';
import { CaseStudy } from '../types';

const EXPECTED_POWER_GRID_IDS = ['network-reconfiguration', 'generation-redispatch', 'renewable-curtailment', 'controlled-load-shedding', 'restoration'];
const EXPECTED_CRITICAL_FACILITY_IDS = ['transfer-critical-load', 'activate-alternate-feed', 'backup-generation', 'shed-noncritical-load', 'restore-primary-supply'];
const EXPECTED_DATA_CENTER_IDS = ['ups-transfer', 'load-shedding', 'workload-migration', 'generator-takeover', 'redundant-path-restoration'];

describe('domain action sets (1-4): each domain gets exactly its own actions', () => {
  test('1. POWER_GRID receives only its appropriate action set', () => {
    const actions = getDomainActions('POWER_GRID');
    assert.deepEqual(actions.map((a) => a.id).sort(), [...EXPECTED_POWER_GRID_IDS].sort());
    for (const a of actions) assert.equal(a.domain, 'POWER_GRID');
  });

  test('2. HOSPITAL (CRITICAL_FACILITY) receives only its appropriate action set', () => {
    const actions = getDomainActions('CRITICAL_FACILITY');
    assert.deepEqual(actions.map((a) => a.id).sort(), [...EXPECTED_CRITICAL_FACILITY_IDS].sort());
    for (const a of actions) assert.equal(a.domain, 'CRITICAL_FACILITY');
  });

  test('3. DATA_CENTER receives only its appropriate action set', () => {
    const actions = getDomainActions('DATA_CENTER');
    assert.deepEqual(actions.map((a) => a.id).sort(), [...EXPECTED_DATA_CENTER_IDS].sort());
    for (const a of actions) assert.equal(a.domain, 'DATA_CENTER');
  });

  test('4. no cross-domain action accidentally appears', () => {
    const powerGridIds = new Set(getDomainActions('POWER_GRID').map((a) => a.id));
    const hospitalIds = new Set(getDomainActions('CRITICAL_FACILITY').map((a) => a.id));
    const dcIds = new Set(getDomainActions('DATA_CENTER').map((a) => a.id));
    // No id should appear in more than one domain's set.
    for (const id of powerGridIds) {
      assert.ok(!hospitalIds.has(id) && !dcIds.has(id), `${id} leaked across domains`);
    }
    for (const id of hospitalIds) {
      assert.ok(!powerGridIds.has(id) && !dcIds.has(id), `${id} leaked across domains`);
    }
    for (const id of dcIds) {
      assert.ok(!powerGridIds.has(id) && !hospitalIds.has(id), `${id} leaked across domains`);
    }
    // And each real case study's declared action ids all belong to its own domain.
    for (const c of getCaseStudies()) {
      const declared = getDomainActions(c.domain).filter((a) => c.domainActionIds.includes(a.id));
      assert.equal(declared.length, c.domainActionIds.length, `${c.id}: some domainActionIds don't resolve to actions in its own domain`);
      for (const a of declared) assert.equal(a.domain, c.domain);
    }
  });
});

describe('action simulation honesty (5-7)', () => {
  test('5. supported actions actually run through the existing engine', () => {
    for (const c of getCaseStudies()) {
      const result = runCaseStudyDomainActions(c);
      assert.ok(result.supportedActions.length > 0, `${c.id} should have at least one supported action`);
      for (const r of result.supportedActions) {
        assert.equal(r.status, 'SIMULATED');
        assert.ok(r.simulation, `${r.action.id} marked SIMULATED must carry a simulation result`);
        // Cross-check: the real engine's own reported actionType matches
        // exactly what the domain action declared as its mechanism —
        // proving the SAME mechanism actually ran, not a relabeled stand-in.
        assert.equal(r.simulation!.actionType, r.action.mechanism);
        // DERIVED, computed fields must be real numbers, not placeholders.
        assert.equal(typeof r.simulation!.disruptionScore, 'number');
        assert.equal(typeof r.simulation!.containmentRate, 'number');
      }
    }
  });

  test('6. unsupported actions never produce fake simulation results', () => {
    for (const c of getCaseStudies()) {
      const result = runCaseStudyDomainActions(c);
      for (const r of result.futureActions) {
        assert.equal(r.status, 'NOT_SIMULATED_REQUIRES_DOMAIN_SOLVER');
        assert.equal(r.simulation, undefined, `${r.action.id} is unsupported and must not carry a simulation result`);
        assert.equal(r.action.requiresFutureDomainSolver, true);
        assert.equal(r.action.canSimulateNow, false);
      }
    }
  });

  test('7. unsupported actions cannot be recommended over simulated actions', () => {
    for (const c of getCaseStudies()) {
      const result = runCaseStudyDomainActions(c);
      if (result.recommendation.status !== 'RECOMMENDED') continue;
      const chosenId = result.recommendation.chosenAction.id;
      const supportedIds = new Set(result.supportedActions.map((r) => r.action.id));
      const futureIds = new Set(result.futureActions.map((r) => r.action.id));
      assert.ok(supportedIds.has(chosenId), `recommended action ${chosenId} must be one of the supported ones`);
      assert.ok(!futureIds.has(chosenId), `recommended action ${chosenId} must never be an unsupported one`);
    }
  });

  test('7b. NO_SIMULATED_ACTION_AVAILABLE is returned (not a fabricated recommendation) when nothing is supported', () => {
    const c = getCaseStudy('case-tn-power-grid-tirunelveli-corridor')!;
    const allUnsupported: DomainAction[] = getDomainActions('POWER_GRID')
      .filter((a) => a.engineSupport === 'REQUIRES_DOMAIN_SOLVER');
    assert.ok(allUnsupported.length > 0, 'sanity: POWER_GRID should have at least one unsupported action to test with');
    const result = runDomainActions(c, allUnsupported);
    assert.equal(result.supportedActions.length, 0);
    assert.equal(result.futureActions.length, allUnsupported.length);
    assert.equal(result.recommendation.status, 'NO_SIMULATED_ACTION_AVAILABLE');
  });
});

describe('regression against Phase 1 / Phase 1.1 (8-10)', () => {
  test('8. existing case-study value behavior remains valid (baseline mechanisms unchanged)', () => {
    const hospital = getCaseStudy('case-chennai-hospital-kcssh-nov2024')!;
    const result = runCaseStudyDomainActions(hospital);
    const backupGeneration = result.supportedActions.find((r) => r.action.id === 'backup-generation')!;
    // Same value-level fact Phase 1.1 established directly on the engine:
    // isolating the main feed affects only the main feed itself, and
    // protects the ICU/critical-care path — still true under the new
    // domain-action label.
    assert.deepEqual(backupGeneration.simulation!.propagationPath, ['utility-main-feed']);

    const dc = getCaseStudy('case-datacenter-ups-cascade')!;
    const dcResult = runCaseStudyDomainActions(dc);
    const upsTransfer = dcResult.supportedActions.find((r) => r.action.id === 'ups-transfer')!;
    // Phase 1.1's central finding: naive reroute-to-backup still overloads
    // the backup UPS in this model — must still hold under the new label.
    assert.ok(upsTransfer.simulation!.propagationPath.includes('backup-ups'));
    assert.equal(upsTransfer.simulation!.isEffective, false);
  });

  test('9. verification remains independent (distinct, deterministic, non-trivial per-run)', () => {
    for (const c of getCaseStudies()) {
      const result = runCaseStudyDomainActions(c);
      if (result.recommendation.status !== 'RECOMMENDED') continue;
      const v = result.recommendation.verification;
      assert.ok(v.testsConducted > 0);
      assert.notEqual(v.independentPerturbation.targetNodeId, 'N/A');
      assert.ok(v.independentPerturbation.magnitude > 0);
      // Determinism: running again must reproduce the identical verification.
      const second = runCaseStudyDomainActions(c);
      assert.deepEqual(
        second.recommendation.status === 'RECOMMENDED' ? second.recommendation.verification : null,
        v
      );
    }
  });

  test('10. no source/evidence classification changed incorrectly since Phase 1.1', () => {
    const tn = getCaseStudy('case-tn-power-grid-tirunelveli-corridor')!;
    const hospital = getCaseStudy('case-chennai-hospital-kcssh-nov2024')!;
    const dc = getCaseStudy('case-datacenter-ups-cascade')!;

    // Uses the untouched Phase 1 runCaseStudy() to prove Phase 2 did not
    // regress the Phase 1.1 evidence-integrity fixes.
    assert.equal(runCaseStudy(tn).realIncidentContext.classification, 'UNCONFIRMED_SECONDARY_EXTRACTION');
    assert.equal(runCaseStudy(hospital).realIncidentContext.classification, 'VERIFIED');
    assert.equal(runCaseStudy(dc).realIncidentContext.classification, 'VERIFIED');
  });
});

describe('non-mutation, derivation, and extensibility (12-14)', () => {
  test('12. no case-study network is mutated by the domain-action runner', () => {
    for (const c of getCaseStudies()) {
      const before = JSON.stringify(c.network);
      runCaseStudyDomainActions(c);
      assert.equal(JSON.stringify(c.network), before, `${c.id}: network must be unmutated after running domain actions`);
    }
  });

  test('13. recommendation numbers are exactly the chosen simulation\'s own numbers (never a separately fabricated score)', () => {
    for (const c of getCaseStudies()) {
      const result = runCaseStudyDomainActions(c);
      const rec = result.recommendation;
      if (rec.status !== 'RECOMMENDED') continue;
      const chosenSim = result.supportedActions.find((r) => r.action.id === rec.chosenAction.id)!.simulation!;
      assert.equal(rec.recommendation.disruptionScore, chosenSim.disruptionScore);
      assert.equal(rec.recommendation.containmentPercentage, chosenSim.containmentRate);
      assert.equal(rec.recommendation.populationImpact, chosenSim.populationImpact);
      assert.equal(rec.recommendation.criticalFacilityImpact, chosenSim.criticalFacilitiesImpact);
    }
  });

  test('14. a future domain can be added without modifying the core propagation engine', () => {
    // A domain this file has never seen before, defined entirely locally —
    // proving the architecture is data-driven, not `if (domain === ...)`
    // branching, and that adding it required zero changes to
    // propagationEngine.ts, interventionEngine.ts, domainActions.ts, or the
    // shared registry.
    const microgridActions: DomainAction[] = [
      {
        id: 'islanding',
        name: 'Islanding',
        domain: 'MICROGRID',
        description: 'Disconnect the microgrid from the main grid and operate independently.',
        category: 'topology',
        engineSupport: 'SUPPORTED_BY_CURRENT_ENGINE',
        mechanism: 'reroute',
        prerequisites: ['Local generation capable of serving local load.'],
        risk: 'moderate',
        canSimulateNow: true,
        requiresFutureDomainSolver: false,
        engineSupportNote: 'Test-only: maps to the existing reroute mechanism.',
      },
      {
        id: 'frequency-regulation',
        name: 'Frequency Regulation',
        domain: 'MICROGRID',
        description: 'Actively regulate local frequency during island mode.',
        category: 'generation',
        engineSupport: 'REQUIRES_DOMAIN_SOLVER',
        prerequisites: ['A frequency-dynamics model.'],
        risk: 'high',
        canSimulateNow: false,
        requiresFutureDomainSolver: true,
        engineSupportNote: 'Test-only: the current engine has no frequency dynamics.',
      },
    ];

    const microgridNetwork: Scenario = {
      id: 'test-microgrid', name: 'Test Microgrid', category: 'MICROGRID', description: '', seed: 1,
      nodes: [
        { id: 'source', name: 'Source', type: 'power_plant', capacity: 100, currentLoad: 90, redundancyFactor: 0.5, populationWeight: 0, critical: true, position: { x: 0, y: 0 } },
        { id: 'load', name: 'Load', type: 'residential', capacity: 100, currentLoad: 10, redundancyFactor: 0.5, populationWeight: 50, critical: false, position: { x: 0, y: 0 } },
      ],
      edges: [{ id: 'e1', source: 'source', target: 'load', loadTransferRatio: 1.0, secondaryEffectMultiplier: 1.0, active: true }],
      initialEvent: { id: 'evt', name: 'evt', type: 'Feeder Trip', nodeId: 'source', nodeName: 'Source', severity: 'Critical', detectedAt: '', confidence: 1, currentObservedValue: 0, normalRange: [0, 1], deltaPercentage: 0, history: [] },
      trueEnvironment: {
        trueCapacity: { source: 100, load: 100 }, trueLoad: { source: 90, load: 10 },
        failureThreshold: { source: 0.8, load: 1.5 }, secondaryEffects: {}, environmentSeed: 1,
      },
      sensorConfig: { dropoutRate: 0, noiseSigma: 0, maxStalenessTicks: 0, sensorSeed: 1 },
      activeSince: '',
    };

    const microgridCase: CaseStudy = {
      id: 'test-microgrid-case', name: 'Test Microgrid Case', domain: 'MICROGRID', location: '', description: '',
      realIncidentSummary: '', expectedObservedMechanism: '', evidence: [], verifiedFacts: [], modeledAssumptions: [],
      network: microgridNetwork,
      initiatingContingency: { nodeId: 'source', description: '', classification: 'MODELLED' },
      availableInterventions: ['reroute'],
      domainActionIds: ['islanding', 'frequency-regulation'],
      counterfactualQuestions: [],
    };

    const result = runDomainActions(microgridCase, microgridActions);
    assert.equal(result.domain, 'MICROGRID');
    assert.equal(result.supportedActions.length, 1);
    assert.equal(result.supportedActions[0].action.id, 'islanding');
    assert.ok(result.supportedActions[0].simulation, 'the supported MICROGRID action must have produced a real simulation result');
    assert.equal(result.futureActions.length, 1);
    assert.equal(result.futureActions[0].action.id, 'frequency-regulation');
    assert.equal(result.futureActions[0].simulation, undefined);
  });
});
