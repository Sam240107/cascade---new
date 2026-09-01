/**
 * domainActionAcceptanceTest.ts
 * ---------------------------------------------------------------------------
 * Prints a CASCADE DOMAIN ACTION AUDIT: for each of the three case studies,
 * which domain-specific actions actually ran through the existing engine
 * (SUPPORTED) vs. which are honestly marked as needing a future
 * domain-specific solver (FUTURE), and what CASCADE derived from the
 * supported ones. Distinguishes, per the Phase 2 spec:
 *
 *   REAL INCIDENT        — cited, historical (VERIFIED / UNCONFIRMED_SECONDARY_EXTRACTION)
 *   MODELLED NETWORK     — representative reconstruction (MODELLED)
 *   SIMULATED ACTION     — ran through the existing, unmodified engine
 *   DERIVED RESULT        — CASCADE's own computed output (DERIVED)
 *   FUTURE/UNSUPPORTED ACTION — named, honest, never simulated or recommended
 *
 * Run with: npm run domain-action-acceptance
 */

import { getCaseStudies } from './registry';
import { runCaseStudy, runCaseStudyDomainActions } from './caseStudyRunner';

console.log('='.repeat(70));
console.log('CASCADE DOMAIN ACTION AUDIT');
console.log('='.repeat(70));

for (const caseStudy of getCaseStudies()) {
  const incident = runCaseStudy(caseStudy); // Phase 1 runner — unchanged; gives the REAL INCIDENT / MODELLED NETWORK sections
  const domainResult = runCaseStudyDomainActions(caseStudy); // Phase 2 runner

  console.log('\n' + '-'.repeat(70));
  console.log(caseStudy.name);
  console.log(`Domain: ${caseStudy.domain}`);

  console.log(`\nREAL INCIDENT [${incident.realIncidentContext.classification}]:`);
  console.log(`  ${caseStudy.realIncidentSummary}`);

  console.log(`\nMODELLED NETWORK [${incident.modelledNetwork.classification}]:`);
  console.log(`  ${incident.modelledNetwork.nodeCount} nodes / ${incident.modelledNetwork.edgeCount} edges`);
  console.log(`  Initiating contingency: ${incident.modelledNetwork.initiatingContingency.description}`);

  console.log('\nSUPPORTED (SIMULATED ACTION -> DERIVED RESULT):');
  for (const r of domainResult.supportedActions) {
    const s = r.simulation!;
    console.log(
      `  - ${r.action.name}: containment ${s.containmentRate}%, disruption ${s.disruptionScore}, ` +
        `${s.affectedNodeCount} nodes affected, effective=${s.isEffective}`
    );
  }
  if (domainResult.supportedActions.length === 0) {
    console.log('  (none)');
  }

  console.log('\nFUTURE DOMAIN-SOLVER ACTIONS (FUTURE/UNSUPPORTED — never simulated, never recommended):');
  for (const r of domainResult.futureActions) {
    console.log(`  - ${r.action.name}: ${r.action.engineSupportNote}`);
  }
  if (domainResult.futureActions.length === 0) {
    console.log('  (none)');
  }

  console.log('\nSelected action:');
  if (domainResult.recommendation.status === 'RECOMMENDED') {
    const rec = domainResult.recommendation;
    console.log(`  ${rec.chosenAction.name}`);
    console.log('\nReason:');
    console.log(`  ${rec.recommendation.reason} (${rec.recommendation.explanationSummary})`);
    console.log(
      `\nDERIVED RESULT: containment ${rec.recommendation.containmentPercentage}%, disruption ${rec.recommendation.disruptionScore}, ` +
        `verification ${rec.verification.status} (${rec.verification.testsPassed}/${rec.verification.testsConducted} trials contained)`
    );
  } else {
    console.log('  NO_SIMULATED_ACTION_AVAILABLE');
    console.log('\nReason:');
    console.log('  No action in this case\'s declared set is SUPPORTED_BY_CURRENT_ENGINE, so no recommendation was made.');
  }
}

console.log('\n' + '='.repeat(70));
console.log('CASCADE is decision support, not direct infrastructure control.');
console.log('Only SUPPORTED_BY_CURRENT_ENGINE actions above were simulated; nothing under FUTURE was run or scored.');
console.log('='.repeat(70));
