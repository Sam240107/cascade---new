/**
 * Lightweight automated tests for the CASCADE simulation engine.
 *
 * Uses Node's built-in test runner (node:test) via tsx — no extra test
 * framework dependency needed. Run with:
 *
 *   npm test
 *   (equivalent to: npx tsx --test src/simulation/__tests__/*.test.ts)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { SimEnvironment } from '../../types/domain';
import {
  buildEnvironmentFromScenario,
  cloneEnvironment,
  simulateCascade,
  applyIsolation,
} from '../propagationEngine';
import { InterventionEngine } from '../interventionEngine';
import { RecommendationEngine } from '../recommendationEngine';
import { VerificationEngine } from '../verificationEngine';
import { SensorGenerator } from '../sensorGenerator';
import { PREDEFINED_SCENARIOS } from '../../data/scenarios';

const urbanGrid = PREDEFINED_SCENARIOS.find((s) => s.id === 'urban-grid-0421')!;

/** Builds a small synthetic 3-node environment for tightly-controlled unit tests. */
function makeSyntheticEnv(): SimEnvironment {
  return {
    seed: 1,
    nodes: {
      A: {
        id: 'A', name: 'Node A', type: 'substation',
        capacity: 100, currentLoad: 60, redundancyFactor: 0.5, populationWeight: 100,
        critical: false, failureThreshold: 100, timeToFailureMinutes: 999, failed: false, isolated: false,
      },
      B: {
        id: 'B', name: 'Node B', type: 'substation',
        capacity: 50, currentLoad: 10, redundancyFactor: 0.5, populationWeight: 200,
        critical: true, failureThreshold: 50, timeToFailureMinutes: 999, failed: false, isolated: false,
      },
      C: {
        id: 'C', name: 'Node C', type: 'substation',
        capacity: 200, currentLoad: 20, redundancyFactor: 0.5, populationWeight: 50,
        critical: false, failureThreshold: 200, timeToFailureMinutes: 999, failed: false, isolated: false,
      },
    },
    edges: [
      { source: 'A', target: 'B', loadTransferRatio: 0.5, secondaryEffectMultiplier: 1.0, active: true },
      { source: 'A', target: 'C', loadTransferRatio: 0.2, secondaryEffectMultiplier: 1.0, active: true },
    ],
  };
}

describe('propagationEngine: core failure/transfer mechanics', () => {
  test('1. a node above its threshold fails', () => {
    const env = makeSyntheticEnv();
    env.nodes.A.currentLoad = 110; // above failureThreshold of 100
    const result = simulateCascade(env, 'A', { forceInitialFailure: false });
    assert.ok(result.failedNodes.includes('A'));
  });

  test('2. load is transferred after failure', () => {
    const env = makeSyntheticEnv();
    env.nodes.A.currentLoad = 110; // transferable load = 110
    const result = simulateCascade(env, 'A', { forceInitialFailure: false });

    // C's threshold (200) is high enough that it survives, so its final load
    // directly shows the transfer landed: 20 base + 110*0.2 = 42.
    assert.equal(result.finalNodeStates.C.load, 42);

    // B's threshold (50) is lower, so it fails as a *result* of the transfer
    // (proven by cause==='overload_cascade') and its load resets to 0 as it
    // trips offline — the transfer step itself is recorded in the log with
    // the pre-failure load of 10 + 110*0.5 = 65.
    const bTransferStep = result.propagationSteps.find((s) => s.nodeId === 'B' && s.eventType === 'load_transfer');
    assert.ok(bTransferStep, 'expected a load_transfer step for B');
    assert.equal(bTransferStep!.loadAfter, 65);
  });

  test('3. a downstream overloaded node can fail as a result of the transfer', () => {
    const env = makeSyntheticEnv();
    env.nodes.A.currentLoad = 110; // sends 55 to B, whose threshold is only 50
    const result = simulateCascade(env, 'A', { forceInitialFailure: false });
    assert.ok(result.failedNodes.includes('B'));
    assert.equal(result.failureCauses.B, 'overload_cascade');
    // C receives only 42, under its threshold of 200 -> should NOT fail.
    assert.ok(!result.failedNodes.includes('C'));
  });

  test('4. a stable node does not fail', () => {
    const env = makeSyntheticEnv(); // A at 60/100, well under threshold
    const result = simulateCascade(env, 'A', { forceInitialFailure: false });
    assert.deepEqual(result.failedNodes, []);
    assert.equal(result.cascadeContained, true);
  });

  test('12. the original environment passed in is never mutated', () => {
    const env = makeSyntheticEnv();
    const snapshotBefore = JSON.stringify(env);
    env.nodes.A.currentLoad = 110;
    const snapshotAfterSettingLoad = JSON.stringify(env);
    simulateCascade(env, 'A', { forceInitialFailure: false });
    // simulateCascade clones internally; the caller's object must be untouched.
    assert.equal(JSON.stringify(env), snapshotAfterSettingLoad);
    assert.notEqual(snapshotBefore, snapshotAfterSettingLoad); // sanity: we did change it ourselves above
  });
});

describe('interventionEngine: reroute and isolate actually change state', () => {
  test('5. reroute changes the network state (moves load, does not mutate the base build)', () => {
    const observation = SensorGenerator.generateObservation(urbanGrid);
    const actions = InterventionEngine.getCandidateActions(urbanGrid);
    const rerouteAction = actions.find((a) => a.type === 'reroute')!;

    const { result, environment } = InterventionEngine.simulateActionWithEnvironment(rerouteAction, urbanGrid, observation);
    const freshBuild = buildEnvironmentFromScenario(urbanGrid);

    // The reroute must have actually used some spare capacity.
    assert.ok(result.details.spareCapacityUsed > 0, 'reroute should shed a nonzero amount of load');
    // The resulting environment must differ from an untouched fresh build.
    assert.notEqual(environment.nodes[rerouteAction.targetNodeId].currentLoad, freshBuild.nodes[rerouteAction.targetNodeId].currentLoad);
    // Building a fresh environment again must be unaffected by the reroute run (no shared mutable state).
    const freshBuildAgain = buildEnvironmentFromScenario(urbanGrid);
    assert.deepEqual(freshBuild, freshBuildAgain);
  });

  test('6. isolation changes topology (severs edges; may strand a radially-fed node)', () => {
    const env = buildEnvironmentFromScenario(urbanGrid);
    const edgesTouchingABefore = env.edges.filter((e) => e.source === 'A' || e.target === 'A').length;
    assert.ok(edgesTouchingABefore > 0);

    const { isolatedIds } = applyIsolation(env, 'A');

    const activeEdgesTouchingAAfter = env.edges.filter((e) => (e.source === 'A' || e.target === 'A') && e.active).length;
    assert.equal(activeEdgesTouchingAAfter, 0, 'all edges touching the isolated node must be deactivated');
    assert.ok(isolatedIds.includes('A'));
    // In the urban grid scenario, Hospital F's only edge is e-A-F, so isolating
    // A must strand it — this must emerge from topology, not be asserted blindly.
    assert.ok(isolatedIds.includes('F'), 'Node F (radially fed only by A) should be stranded by isolating A');
  });
});

describe('interventionEngine: crew dispatch timing', () => {
  test('7. crew succeeds when ETA is before time-to-failure', () => {
    const observation = SensorGenerator.generateObservation(urbanGrid);
    // Force a generous observed time-to-failure so the crew's fixed ETA beats it.
    observation.nodes[urbanGrid.initialEvent.nodeId].timeToFailureMinutes = 999;

    const actions = InterventionEngine.getCandidateActions(urbanGrid);
    const crewAction = actions.find((a) => a.type === 'crew')!;
    const { result } = InterventionEngine.simulateActionWithEnvironment(crewAction, urbanGrid, observation);

    assert.equal(result.isEffective, true);
    assert.ok(!result.propagationPath.includes(urbanGrid.initialEvent.nodeId));
  });

  test('8. crew fails when ETA is after time-to-failure', () => {
    const observation = SensorGenerator.generateObservation(urbanGrid);
    // Force a very short observed time-to-failure so the crew cannot beat it.
    observation.nodes[urbanGrid.initialEvent.nodeId].timeToFailureMinutes = 1;

    const actions = InterventionEngine.getCandidateActions(urbanGrid);
    const crewAction = actions.find((a) => a.type === 'crew')!;
    const { result } = InterventionEngine.simulateActionWithEnvironment(crewAction, urbanGrid, observation);

    assert.ok(result.propagationPath.includes(urbanGrid.initialEvent.nodeId));
  });
});

describe('recommendationEngine: filtering and selection', () => {
  const baseSim = {
    actionId: 'x', actionType: 'reroute' as const, title: 'X', description: '',
    containmentRate: 90, containmentLabel: 'YES' as const, populationImpact: 100,
    criticalFacilitiesImpact: 0, nodesStressAfter: {}, affectedNodeCount: 1,
    propagationPath: [], details: { downtimeHours: 1, spareCapacityUsed: 0, overflowProduced: 0, rationale: '' },
  };

  test('9. recommendation rejects ineffective actions', () => {
    const simulations = [
      { ...baseSim, actionId: 'a', isEffective: true, disruptionScore: 50 },
      { ...baseSim, actionId: 'b', isEffective: false, disruptionScore: 5 },
    ];
    const rec = RecommendationEngine.evaluate(simulations, urbanGrid);
    assert.equal(rec.actionId, 'a');
    assert.ok(rec.rejectedAlternatives.some((r) => r.actionId === 'b'));
  });

  test('10. recommendation selects the lowest-disruption EFFECTIVE action', () => {
    const simulations = [
      { ...baseSim, actionId: 'cheap-ineffective', isEffective: false, disruptionScore: 1 },
      { ...baseSim, actionId: 'expensive-effective', isEffective: true, disruptionScore: 80 },
      { ...baseSim, actionId: 'cheap-effective', isEffective: true, disruptionScore: 20 },
    ];
    const rec = RecommendationEngine.evaluate(simulations, urbanGrid);
    assert.equal(rec.actionId, 'cheap-effective');
  });
});

describe('verificationEngine: independent second shock', () => {
  test('11. verification runs a genuine independent propagation against the post-fix state', () => {
    const observation = SensorGenerator.generateObservation(urbanGrid);
    const simulations = InterventionEngine.simulateAll(urbanGrid, observation);
    const recommendation = RecommendationEngine.evaluate(simulations, urbanGrid);
    const chosenSim = simulations.find((s) => s.actionId === recommendation.actionId)!;

    // Note: in CASCADE-NEW, runVerification's positional args are
    // (recommendation, simulationResult, scenario, testRunsCount, observation)
    // — testRunsCount stays in its original 4th slot for AppContext.tsx
    // compatibility, with observation appended as an optional 5th argument.
    const verification = VerificationEngine.runVerification(recommendation, chosenSim, urbanGrid, 5, observation);

    assert.ok(verification.testsConducted > 0, 'should actually run trials');
    assert.ok(['PASSED', 'FAILED'].includes(verification.status));
    assert.notEqual(verification.independentPerturbation.targetNodeId, 'N/A');
    assert.ok(verification.independentPerturbation.magnitude > 0);
  });
});
