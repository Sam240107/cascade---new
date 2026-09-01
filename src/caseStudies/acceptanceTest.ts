/**
 * caseStudies/acceptanceTest.ts
 * ---------------------------------------------------------------------------
 * Runs all three registered real-world case studies end-to-end through the
 * EXISTING, unmodified CASCADE engine and prints a concise summary,
 * distinguishing:
 *
 *   1. REAL INCIDENT CONTEXT   (VERIFIED — cited public sources)
 *   2. MODELLED NETWORK        (MODELLED — representative reconstruction)
 *   3. CASCADE COUNTERFACTUAL  (DERIVED  — computed by CASCADE, not history)
 *
 * This does NOT manufacture a "historical CASCADE result" — the historical
 * incident is validation context only; every number under "CASCADE
 * counterfactual" below is a fresh calculation over the modelled network.
 *
 * Run with: npm run case-study-acceptance
 */

import { getCaseStudies } from './registry';
import { runCaseStudy } from './caseStudyRunner';

console.log('='.repeat(70));
console.log('CASCADE — REAL-WORLD CASE STUDY ACCEPTANCE TEST');
console.log('='.repeat(70));

for (const caseStudy of getCaseStudies()) {
  const result = runCaseStudy(caseStudy);
  const { baseline, recommendation, verification } = result.cascadeCounterfactual;

  console.log('\n' + '-'.repeat(70));
  console.log(`CASE: ${result.caseName}`);
  console.log(`Domain: ${result.domain}`);
  console.log(`Evidence: ${result.realIncidentContext.evidence.map((e) => `${e.title} (${e.organization}, ${e.verificationMethod})`).join('; ')}`);
  console.log(`Evidence classification: ${result.realIncidentContext.classification}`);
  console.log(`Observed mechanism: ${result.realIncidentContext.observedMechanism}`);
  console.log(
    `Modelled topology: ${result.modelledNetwork.nodeCount} nodes / ${result.modelledNetwork.edgeCount} edges, ` +
      `initiating contingency = "${result.modelledNetwork.initiatingContingency.description}" [${result.modelledNetwork.classification}]`
  );
  console.log(
    `CASCADE counterfactual: baseline ${baseline.cascadeContained ? 'contained' : 'NOT contained'} ` +
      `(${baseline.affectedNodeCount} affected nodes, cascade depth ${baseline.cascadeDepth}, max stress ${baseline.maximumStress}%) -> ` +
      `recommended "${recommendation.title}" ` +
      `(disruption ${recommendation.disruptionScore}, containment ${recommendation.containmentPercentage}%) -> ` +
      `verification ${verification.status} (${verification.testsPassed}/${verification.testsConducted} trials contained)`
  );
  console.log(`Result classification: ${result.cascadeCounterfactual.classification}`);
}

console.log('\n' + '='.repeat(70));
console.log('ALL CASE STUDIES RAN THROUGH THE EXISTING ENGINE — NO VALUES HARDCODED');
console.log('='.repeat(70));
