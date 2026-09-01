/**
 * Phase 3 — lightweight UI-integration smoke tests.
 *
 * Per the Phase 3 spec this is deliberately NOT a large suite: no React
 * rendering harness is added (no new dependency), so these tests exercise
 * the exact data-layer functions AppContext.tsx wires into the existing
 * pages/components, proving the integration is honest without duplicating
 * Phase 1/1.1/2's own engine test coverage.
 *
 * Run with: npm test
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { getCaseStudies, getCaseStudy } from '../registry';
import { runCaseStudy, runCaseStudyDomainActions } from '../caseStudyRunner';
import { buildGroundTruthObservation } from '../caseStudyObservationAdapter';

describe('Phase 3 UI integration', () => {
  test('1. case selection works: all three real-world cases are selectable by id', () => {
    const cases = getCaseStudies();
    assert.equal(cases.length, 3);
    for (const c of cases) {
      assert.equal(getCaseStudy(c.id)?.id, c.id);
    }
  });

  test('2. selecting a case reaches valid dashboard-shaped state (network, observation, actions)', () => {
    for (const c of getCaseStudies()) {
      // Mirrors exactly what AppContext.selectCaseStudy() drives: the
      // case's own network becomes `selectedScenario`, and the ground-truth
      // adapter becomes `observation` — both must be internally consistent
      // (same node ids) or NetworkCard/RiskPage would crash, as caught by
      // the render-timing bug this phase's browser testing found.
      const observation = buildGroundTruthObservation(c.network);
      const networkNodeIds = new Set(c.network.nodes.map((n) => n.id));
      const observationNodeIds = new Set(Object.keys(observation.nodes));
      assert.deepEqual(observationNodeIds, networkNodeIds, `${c.id}: observation must cover exactly the network's own nodes`);
      assert.ok(observation.nodes[c.initiatingContingency.nodeId], `${c.id}: observation must include the initiating node`);
    }
  });

  test('3. UI-consumable output is the actual runner output (spot-checked field-for-field)', () => {
    for (const c of getCaseStudies()) {
      const csResult = runCaseStudy(c);
      const daResult = runCaseStudyDomainActions(c);
      // What CaseContextCard/SubHeader/OverviewPage display must trace
      // directly back to these two runner calls, not a UI-side recomputation.
      assert.equal(csResult.caseId, c.id);
      assert.equal(daResult.caseId, c.id);
      if (daResult.recommendation.status === 'RECOMMENDED') {
        const rec = daResult.recommendation;
        // The chosen action must actually be one of the SIMULATED supported
        // actions this same run produced — never a separate/invented one.
        const chosen = daResult.supportedActions.find((r) => r.action.id === rec.chosenAction.id);
        assert.ok(chosen, `${c.id}: recommended action must be among supportedActions`);
        // And the recommendation's numbers must equal that action's own
        // computed SimulationResult numbers exactly (no separate UI figure).
        assert.equal(rec.recommendation.disruptionScore, chosen!.simulation!.disruptionScore);
        assert.equal(rec.recommendation.containmentPercentage, chosen!.simulation!.containmentRate);
      }
    }
  });

  test('4. unsupported (future) actions are never presented as simulated', () => {
    for (const c of getCaseStudies()) {
      const daResult = runCaseStudyDomainActions(c);
      for (const r of daResult.futureActions) {
        assert.equal(r.simulation, undefined, `${c.id}: future action ${r.action.id} must not carry a simulation result`);
        assert.equal(r.action.engineSupport, 'REQUIRES_DOMAIN_SOLVER');
      }
      // And the recommendation, when present, is always one of the SIMULATED ones.
      if (daResult.recommendation.status === 'RECOMMENDED') {
        const futureIds = new Set(daResult.futureActions.map((r) => r.action.id));
        assert.ok(!futureIds.has(daResult.recommendation.chosenAction.id));
      }
    }
  });

  test('5. evidence classification is exactly what the UI reads (SubHeader/CaseContextCard/ScenariosPage)', () => {
    const tn = runCaseStudy(getCaseStudy('case-tn-power-grid-tirunelveli-corridor')!);
    const hospital = runCaseStudy(getCaseStudy('case-chennai-hospital-kcssh-nov2024')!);
    const dc = runCaseStudy(getCaseStudy('case-datacenter-ups-cascade')!);
    assert.equal(tn.realIncidentContext.classification, 'UNCONFIRMED_SECONDARY_EXTRACTION');
    assert.equal(hospital.realIncidentContext.classification, 'VERIFIED');
    assert.equal(dc.realIncidentContext.classification, 'VERIFIED');
  });

  test('6. the case-study observation path never imports/invokes SensorGenerator', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const filesToCheck = ['../caseStudyObservationAdapter.ts', '../caseStudyRunner.ts'];
    const importOrCallPattern = /(?:import[^;]*sensorGenerator[^;]*;|SensorGenerator\s*\.)/i;
    for (const rel of filesToCheck) {
      const source = readFileSync(join(here, rel), 'utf8');
      assert.ok(!importOrCallPattern.test(source), `${rel} must never import or invoke SensorGenerator`);
    }
  });
});
