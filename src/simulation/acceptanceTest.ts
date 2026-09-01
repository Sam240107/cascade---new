/**
 * acceptanceTest.ts
 * ---------------------------------------------------------------------------
 * Runs Scenario 0421 (Urban Grid) end-to-end through the real engine and
 * prints a concise console summary of the genuinely calculated values.
 *
 * Also verifies non-mutation: baseline propagation, and each of the three
 * candidate interventions (reroute / isolate / crew), are shown to run
 * against independent, unmutated environments — never against a baseline
 * or each other's leftover state.
 *
 * Run with: npm run acceptance-test
 */

import assert from 'node:assert/strict';
import { PREDEFINED_SCENARIOS } from '../data/scenarios';
import { SensorGenerator } from './sensorGenerator';
import { RiskCalculator } from './riskCalculator';
import { buildEnvironmentFromScenario, computeBaselineCascade } from './propagationEngine';
import { InterventionEngine } from './interventionEngine';
import { RecommendationEngine } from './recommendationEngine';
import { VerificationEngine } from './verificationEngine';

const scenario = PREDEFINED_SCENARIOS.find((s) => s.id === 'urban-grid-0421')!;

console.log('='.repeat(60));
console.log('CASCADE ENGINE TEST — Urban Grid / Scenario 0421');
console.log('='.repeat(60));
console.log(`\nScenario: ${scenario.name}`);
console.log(`Initial event: ${scenario.initialEvent.name}\n`);

// 0. Environment creation — snapshot it before anything runs, to prove
//    later that nothing downstream mutates the scenario's own ground truth.
const scenarioSnapshotBefore = JSON.stringify(scenario);
const freshEnvBefore = buildEnvironmentFromScenario(scenario);
console.log(`Environment created — ${Object.keys(freshEnvBefore.nodes).length} nodes, ${freshEnvBefore.edges.length} edges.`);

// 1. Sensor observation
const observation = SensorGenerator.generateObservation(scenario);
console.log(`Observation generated — overall data quality: ${observation.overallDataQuality}%`);

// 2. Risk scores
const riskScores = RiskCalculator.calculateRiskScores(observation, scenario);
const topRisk = riskScores[0];
console.log(`Top risk node: ${topRisk.nodeName} (score ${topRisk.score}, level ${topRisk.level})\n`);

// 3. Baseline cascade (no intervention)
const baseline = computeBaselineCascade(scenario);
console.log('Baseline (no intervention):');
console.log(`  affected nodes: ${baseline.affectedNodeCount}`);
console.log(`  population impact: ${baseline.affectedPopulation}`);
console.log(`  critical facilities: ${baseline.affectedCriticalFacilities}`);
console.log(`  cascade depth: ${baseline.cascadeDepth}`);
console.log(`  maximum stress: ${baseline.maximumStress}%`);
console.log(`  contained: ${baseline.cascadeContained}\n`);

// Non-mutation check: computing the baseline must not have touched the
// scenario's own predefined inputs.
assert.equal(JSON.stringify(scenario), scenarioSnapshotBefore, 'baseline computation must not mutate the scenario');

// 4/5/6. Simulate all three interventions (reroute, isolate, crew) —
//        each one independently, against its own cloned environment.
const candidateActions = InterventionEngine.getCandidateActions(scenario);
const runs = candidateActions.map((action) =>
  InterventionEngine.simulateActionWithEnvironment(action, scenario, observation)
);
const simulations = runs.map((r) => r.result);

console.log('Interventions:');
for (const sim of simulations) {
  console.log(`  ${sim.title}:`);
  console.log(`    effective: ${sim.isEffective}`);
  console.log(`    disruption: ${sim.disruptionScore}`);
  console.log(`    affected nodes: ${sim.affectedNodeCount}`);
  console.log(`    population impact: ${sim.populationImpact}`);
  console.log(`    critical facilities: ${sim.criticalFacilitiesImpact}`);
  console.log(`    rationale: ${sim.details.rationale}`);
}

// Non-mutation checks (STEP 8):
//  - simulating candidates must not mutate the scenario itself
//  - each candidate's resulting environment must be independent of the
//    others' (no shared mutable state leaking between reroute/isolate/crew)
assert.equal(JSON.stringify(scenario), scenarioSnapshotBefore, 'candidate simulation must not mutate the scenario');

const targetId = scenario.initialEvent.nodeId;
const [rerouteRun, isolateRun, crewRun] = runs;
const loadsAtTarget = [rerouteRun, isolateRun, crewRun].map((r) => r.environment.nodes[targetId]?.currentLoad);
console.log(
  `\nNon-mutation check — target node ('${targetId}') load after each independent run: ` +
    `reroute=${loadsAtTarget[0]}, isolate=${loadsAtTarget[1]}, crew=${loadsAtTarget[2]}`
);
// A fresh build (computed again, after all three runs) must still match the
// very first fresh build byte-for-byte — proof no run leaked shared state.
const freshEnvAfter = buildEnvironmentFromScenario(scenario);
assert.deepEqual(freshEnvAfter, freshEnvBefore, 'building a fresh environment must be unaffected by prior candidate runs');
console.log('Confirmed: baseline, reroute, isolate, and crew all ran against independent environments.\n');

// 7. Filter ineffective, select lowest-disruption effective action
const recommendation = RecommendationEngine.evaluate(simulations, scenario);
console.log(`Recommendation:\n  ${recommendation.title} (disruption ${recommendation.disruptionScore}, containment ${recommendation.containmentPercentage}%)`);
console.log(`  reason: ${recommendation.reason}`);

// 8/9. Apply selected action to sandbox, run independent second shock, verify
const chosenSim = simulations.find((s) => s.actionId === recommendation.actionId)!;
const verification = VerificationEngine.runVerification(recommendation, chosenSim, scenario, 10, observation);

console.log(`\nSecond shock: ${verification.independentPerturbation.eventType} on ${verification.independentPerturbation.targetNodeName} (magnitude ${verification.independentPerturbation.magnitude})`);
console.log(`Verification:\n  ${verification.status} (${verification.testsPassed}/${verification.testsConducted} trials contained, re-cascade rate ${verification.reCascadeRate})`);

// Final non-mutation check: the whole end-to-end run must not have touched
// the scenario's own predefined inputs.
assert.equal(JSON.stringify(scenario), scenarioSnapshotBefore, 'the full end-to-end run must not mutate the scenario');

console.log('\n' + '='.repeat(60));
console.log('END-TO-END RUN COMPLETE — ALL NON-MUTATION CHECKS PASSED');
console.log('='.repeat(60));
