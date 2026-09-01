/**
 * Tests for the Real-World Case Study Layer.
 *
 * Run with: npm test
 * (tsx --test src/simulation/__tests__/*.test.ts src/caseStudies/__tests__/*.test.ts)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { CASE_STUDIES, getCaseStudies, getCaseStudy } from '../registry';
import { runCaseStudy } from '../caseStudyRunner';
import { KNOWN_CASE_STUDY_DOMAINS } from '../types';
import { buildEnvironmentFromScenario, simulateCascade, computeBaselineCascade } from '../../simulation/propagationEngine';
import { InterventionEngine } from '../../simulation/interventionEngine';

describe('case-study registry', () => {
  test('1. all three case studies load successfully', () => {
    const cases = getCaseStudies();
    assert.equal(cases.length, 3);
    assert.equal(CASE_STUDIES.length, 3);
    for (const c of cases) {
      assert.ok(c.id, `case missing id: ${JSON.stringify(c).slice(0, 80)}`);
      assert.ok(getCaseStudy(c.id), `getCaseStudy(${c.id}) should find it`);
    }
  });

  test('2. each case has a valid (known, extensible) domain', () => {
    for (const c of getCaseStudies()) {
      assert.ok(typeof c.domain === 'string' && c.domain.length > 0);
      // All three shipped cases use a known domain today, but the type
      // itself does not restrict future cases to this list.
      assert.ok((KNOWN_CASE_STUDY_DOMAINS as readonly string[]).includes(c.domain));
    }
  });

  test('3. each case has source/evidence metadata with required fields', () => {
    for (const c of getCaseStudies()) {
      assert.ok(c.evidence.length > 0, `${c.id} should cite at least one source`);
      for (const src of c.evidence) {
        assert.ok(src.title, `${c.id}: evidence missing title`);
        assert.ok(src.organization, `${c.id}: evidence missing organization`);
        assert.ok(src.url.startsWith('http'), `${c.id}: evidence url should be a real URL`);
        assert.ok(src.supports, `${c.id}: evidence missing "supports" statement`);
        assert.ok(
          src.verificationMethod === 'direct-read' || src.verificationMethod === 'secondary-extraction',
          `${c.id}: evidence "${src.title}" missing a valid verificationMethod`
        );
      }
    }
  });

  test('4. verified facts and modelled assumptions are distinguishable, and evidence-tier-consistent', () => {
    for (const c of getCaseStudies()) {
      assert.ok(c.verifiedFacts.length > 0, `${c.id} should have verifiedFacts`);
      assert.ok(c.modeledAssumptions.length > 0, `${c.id} should have modeledAssumptions`);

      for (const fact of c.verifiedFacts) {
        // A sourced fact is either directly confirmed (VERIFIED) or only
        // resting on secondary extraction (UNCONFIRMED_SECONDARY_EXTRACTION)
        // — either way it must cite evidence, and its classification must
        // match what that evidence's own verificationMethod actually supports.
        assert.ok(
          ['VERIFIED', 'UNCONFIRMED_SECONDARY_EXTRACTION'].includes(fact.classification),
          `${c.id}: verifiedFacts entries must be VERIFIED or UNCONFIRMED_SECONDARY_EXTRACTION, got ${fact.classification}`
        );
        assert.ok(fact.evidenceIds && fact.evidenceIds.length > 0, `${c.id}: sourced fact must cite evidence`);
        for (const evId of fact.evidenceIds!) {
          const ev = c.evidence.find((e) => e.id === evId);
          assert.ok(ev, `${c.id}: evidence id ${evId} must exist`);
          // Never silently upgraded: a fact citing a secondary-extraction
          // source cannot itself claim VERIFIED, and vice versa.
          if (ev!.verificationMethod === 'secondary-extraction') {
            assert.equal(fact.classification, 'UNCONFIRMED_SECONDARY_EXTRACTION', `${c.id}: fact citing a secondary-extraction source must not claim VERIFIED`);
          } else {
            assert.equal(fact.classification, 'VERIFIED', `${c.id}: fact citing a direct-read source should be VERIFIED, not downgraded`);
          }
        }
      }
      for (const assumption of c.modeledAssumptions) {
        assert.equal(assumption.classification, 'MODELLED');
      }
      // The two sets must not share statement text (structurally distinguishable).
      const verifiedText = new Set(c.verifiedFacts.map((f) => f.statement));
      const modelledText = new Set(c.modeledAssumptions.map((f) => f.statement));
      for (const t of verifiedText) assert.ok(!modelledText.has(t));
    }
  });

  test('5. each case produces a valid SimEnvironment via the existing engine', () => {
    for (const c of getCaseStudies()) {
      const env = buildEnvironmentFromScenario(c.network);
      assert.ok(Object.keys(env.nodes).length === c.network.nodes.length);
      assert.ok(env.edges.length === c.network.edges.length);
      // The initiating contingency must reference a real node in the network.
      assert.ok(env.nodes[c.initiatingContingency.nodeId], `${c.id}: initiatingContingency.nodeId must exist in network`);
      assert.equal(c.network.initialEvent.nodeId, c.initiatingContingency.nodeId);
    }
  });

  test('6. each case can run through the existing propagation engine directly', () => {
    for (const c of getCaseStudies()) {
      const env = buildEnvironmentFromScenario(c.network);
      const result = simulateCascade(env, c.initiatingContingency.nodeId, { forceInitialFailure: true });
      assert.ok(Array.isArray(result.failedNodes));
      assert.ok(typeof result.cascadeContained === 'boolean');
    }
  });
});

describe('case-study runner', () => {
  test('8. running a case does not mutate its source network', () => {
    for (const c of getCaseStudies()) {
      const before = JSON.stringify(c.network);
      runCaseStudy(c);
      assert.equal(JSON.stringify(c.network), before, `${c.id}: network must be unmutated after running`);
    }
  });

  test('8b. two independent runs of the same case produce independent results (no shared mutable state)', () => {
    for (const c of getCaseStudies()) {
      const first = runCaseStudy(c);
      const second = runCaseStudy(c);
      assert.deepEqual(first.cascadeCounterfactual.baseline, second.cascadeCounterfactual.baseline);
      assert.deepEqual(
        first.cascadeCounterfactual.interventions.map((s) => s.actionId),
        second.cascadeCounterfactual.interventions.map((s) => s.actionId)
      );
    }
  });

  test('9. no fake "live" sensor data is introduced by a case or its run result', () => {
    for (const c of getCaseStudies()) {
      // Case networks declare zeroed sensor noise/dropout — the runner
      // never calls SensorGenerator, so this config is inert, but it must
      // not itself smuggle in nonzero "live" noise parameters.
      assert.equal(c.network.sensorConfig.dropoutRate, 0);
      assert.equal(c.network.sensorConfig.noiseSigma, 0);

      const result = runCaseStudy(c);
      // The run result must not carry any Observation-shaped payload.
      assert.ok(!('observation' in result));
      assert.ok(!('observation' in result.cascadeCounterfactual));
    }
  });

  test('9b. caseStudyRunner.ts never imports/invokes SensorGenerator (source-level guard)', () => {
    // #9 only checks the OUTPUT shape — it would not catch an implementation
    // that called SensorGenerator internally and simply discarded the
    // result. This scans the actual source text for an `import`/`require`
    // of the sensor module or a `SensorGenerator.` call — proving it is
    // never wired in at all, not just absent from the output. (Explanatory
    // prose mentioning "SensorGenerator" by name, e.g. in a doc comment
    // describing why it's avoided, is fine and does not trip this check.)
    const here = dirname(fileURLToPath(import.meta.url));
    const caseStudiesDir = join(here, '..');
    const filesToCheck = ['caseStudyRunner.ts', 'tamilNaduGrid.ts', 'chennaiHospital.ts', 'dataCenterUPS.ts'];
    const importOrCallPattern = /(?:import[^;]*sensorGenerator[^;]*;|require\(\s*['"][^'"]*sensorGenerator[^'"]*['"]\s*\)|SensorGenerator\s*\.)/i;
    for (const file of filesToCheck) {
      const source = readFileSync(join(caseStudiesDir, file), 'utf8');
      assert.ok(
        !importOrCallPattern.test(source),
        `${file} must never import or invoke SensorGenerator — case studies bypass the synthetic sensor layer entirely`
      );
    }
  });

  test('10. counterfactual results are marked DERIVED, not VERIFIED or UNCONFIRMED_SECONDARY_EXTRACTION', () => {
    for (const c of getCaseStudies()) {
      const result = runCaseStudy(c);
      assert.equal(result.cascadeCounterfactual.classification, 'DERIVED');
      assert.ok(['VERIFIED', 'UNCONFIRMED_SECONDARY_EXTRACTION'].includes(result.realIncidentContext.classification));
      assert.equal(result.modelledNetwork.classification, 'MODELLED');
      // Meaningful bounds (not the vacuous `>= 0` a count satisfies by
      // construction): affected nodes can never exceed the network's own
      // node count, and containment/disruption must be non-negative reals.
      const totalNodes = c.network.nodes.length;
      assert.ok(result.cascadeCounterfactual.baseline.affectedNodeCount <= totalNodes);
      assert.ok(result.cascadeCounterfactual.recommendation.containmentPercentage >= 0 && result.cascadeCounterfactual.recommendation.containmentPercentage <= 100);
      assert.ok(result.cascadeCounterfactual.recommendation.disruptionScore >= 0);
      assert.ok(result.cascadeCounterfactual.interventions.length > 0);
      assert.ok(['PASSED', 'FAILED'].includes(result.cascadeCounterfactual.verification.status));
    }
  });

  test('runner honors each case\'s availableInterventions filter', () => {
    for (const c of getCaseStudies()) {
      const result = runCaseStudy(c);
      const types = new Set(result.cascadeCounterfactual.interventions.map((s) => s.actionType));
      for (const t of types) assert.ok(c.availableInterventions.includes(t));
      assert.equal(types.size, c.availableInterventions.length);
    }
  });
});

describe('value-level correctness (Phase 1.1 Fix 3) — one real assertion per case, no magic numbers', () => {
  test('Chennai Hospital: baseline fails the general-service path while the protected critical-care/ICU path survives', () => {
    const hospital = getCaseStudy('case-chennai-hospital-kcssh-nov2024')!;
    const baseline = computeBaselineCascade(hospital.network);

    // The documented mechanism: main feed + its degraded backup path fail
    // (general ward affected), while the independent, better-provisioned
    // generator path protecting the ICU/ventilator load does not.
    assert.ok(baseline.failedNodes.includes('utility-main-feed'), 'main feed should fail under the modeled fire contingency');
    assert.ok(baseline.failedNodes.includes('general-ward-load'), 'general ward should be affected, matching the real outage');
    assert.ok(!baseline.failedNodes.includes('icu-ventilator-load'), 'ICU/ventilator load must survive — matches the verified incident (critical-care patients were not affected)');
    assert.ok(!baseline.failedNodes.includes('generator-b'), 'the protected generator path must survive');
  });

  test('Tamil Nadu: the modeled corridor contingency cascades to the downstream 230kV network, and reroute contains it', () => {
    const tn = getCaseStudy('case-tn-power-grid-tirunelveli-corridor')!;
    const baseline = computeBaselineCascade(tn.network);

    assert.ok(baseline.failedNodes.includes('kanarpatti-400kv'), 'the corridor node itself must fail under the modeled contingency');
    // The real documented mechanism is that a corridor trip overloads the
    // downstream 230kV network broadly, not just a single neighbor.
    const downstreamAreas = ['chennai-230kv', 'arasur-230kv', 'trichy-230kv', 'madurai-230kv', 'karaikudi-230kv', 'neyveli-230kv', 'hosur-230kv'];
    const affectedDownstream = downstreamAreas.filter((id) => baseline.failedNodes.includes(id));
    assert.ok(affectedDownstream.length >= 4, `expected a broad downstream cascade, got only ${affectedDownstream.length}/7 areas affected`);
    assert.equal(baseline.cascadeContained, false);

    // Reroute (the modeled SPS-style proactive mitigation) must actually
    // contain what baseline could not — proving the intervention changes
    // the outcome, not just relabels it.
    const actions = InterventionEngine.getCandidateActions(tn.network);
    const rerouteAction = actions.find((a) => a.type === 'reroute')!;
    const { result: rerouteResult } = InterventionEngine.simulateActionWithEnvironment(rerouteAction, tn.network);
    assert.equal(rerouteResult.propagationPath.length, 0, 'reroute should leave the corridor and downstream network unaffected');
  });

  test('Data center: the primary-UPS contingency reproduces the documented backup-UPS overload, including under the reroute fix attempt', () => {
    const dc = getCaseStudy('case-datacenter-ups-cascade')!;
    const baseline = computeBaselineCascade(dc.network);

    assert.ok(baseline.failedNodes.includes('primary-ups'), 'the primary UPS itself must fail under the modeled control-board fault');
    assert.ok(baseline.failedNodes.includes('backup-ups'), 'the backup UPS must become overloaded and fail too — this is the cited, documented finding (~236% of its rating)');

    // The cited source's own point is that the backup path was not sized
    // for the full transferred load — so a naive reroute-to-backup should
    // still reproduce the backup-UPS failure, not silently fix it.
    const actions = InterventionEngine.getCandidateActions(dc.network);
    const rerouteAction = actions.find((a) => a.type === 'reroute')!;
    const { result: rerouteResult } = InterventionEngine.simulateActionWithEnvironment(rerouteAction, dc.network);
    assert.ok(
      rerouteResult.propagationPath.includes('backup-ups'),
      'reroute alone should still overload the backup UPS in this model, echoing the documented real-world finding'
    );
    assert.equal(rerouteResult.isEffective, false, 'reroute alone should not be effective for this case');
  });
});
