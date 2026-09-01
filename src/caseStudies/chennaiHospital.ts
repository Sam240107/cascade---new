/**
 * Case Study 2 — Chennai Hospital Power Outage (KCSSH, November 2024)
 * ---------------------------------------------------------------------------
 * Domain: CRITICAL_FACILITY
 *
 * REAL INCIDENT (VERIFIED, cited below): On the night of 16–17 November
 * 2024, a fire in the main incoming power cable at Kalaignar Centenary
 * Super Specialty Hospital (KCSSH), Guindy, Chennai, also affected the
 * generator supply cable. Officials confirmed power was maintained to all
 * 419 patients present, including 15 on ventilator support, via a separate
 * backup generator, and power was restored within about an hour using an
 * alternate HT cable as an interim measure. Critical-care/ventilator
 * patients were not affected.
 *
 * We do NOT have the hospital's private electrical one-line diagram.
 * Every node/edge/capacity value below is a MODELLED, representative
 * reconstruction of the documented failure mechanism (main cable fire ->
 * generator cable also affected -> separate generator protects critical
 * care), clearly labeled as such — see `modeledAssumptions`. Only the
 * patient counts (419 total / 15 on ventilators) are directly grounded in
 * the cited source.
 */

import { CaseStudy } from './types';
import { Scenario } from '../types/domain';

const EVIDENCE_REPUBLIC_WORLD = 'ev-republicworld-kcssh';
const EVIDENCE_DT_NEXT = 'ev-dtnext-kcssh-followup';

const network: Scenario = {
  id: 'case-chennai-hospital-kcssh-nov2024',
  name: 'KCSSH Main Cable Fire (Representative)',
  category: 'CRITICAL_FACILITY',
  description:
    'Representative model of the documented main-cable fire and backup-generator response at a Chennai ' +
    'hospital, reconstructed from public incident reporting only.',
  seed: 241117,
  nodes: [
    {
      id: 'utility-main-feed',
      name: 'Main Incoming HT Cable/Feed',
      type: 'substation',
      capacity: 440, // MODELLED — representative facility-scale supply capacity
      // MODELLED — an arbitrary representative electrical load value, chosen
      // near (but NOT derived from) the documented 419-patient count purely
      // for narrative legibility. There is no stated relationship between
      // patient count and electrical load (kVA/kW) in any cited source; do
      // not read this number as a measured or estimated facility rating.
      currentLoad: 420,
      redundancyFactor: 0.05, // MODELLED — single main cable, no redundancy (the documented vulnerability)
      populationWeight: 0,
      critical: true,
      position: { x: 60, y: 160 },
    },
    {
      id: 'generator-a',
      name: 'Primary Standby Generator (cable also affected by the fire)',
      type: 'substation',
      capacity: 260,
      currentLoad: 10, // idle/standby draw
      redundancyFactor: 0.3, // MODELLED — degraded, since its own cable was documented as also impacted
      populationWeight: 0,
      critical: false,
      position: { x: 220, y: 90 },
    },
    {
      id: 'generator-b',
      name: 'Independent Backup Generator (separate protected line)',
      type: 'substation',
      capacity: 220,
      currentLoad: 10,
      redundancyFactor: 0.85, // MODELLED — the documented "separate power line" that held
      populationWeight: 0,
      critical: false,
      position: { x: 220, y: 230 },
    },
    {
      id: 'general-ward-load',
      name: 'General Ward Patient Load',
      type: 'hospital',
      capacity: 260,
      currentLoad: 5,
      redundancyFactor: 0.2,
      populationWeight: 404, // VERIFIED-grounded: 419 total patients - 15 on ventilators
      critical: false,
      position: { x: 380, y: 90 },
    },
    {
      id: 'icu-ventilator-load',
      name: 'ICU / Ventilator-Dependent Patient Load',
      type: 'hospital',
      capacity: 220,
      currentLoad: 5,
      redundancyFactor: 0.9,
      populationWeight: 15, // VERIFIED: 15 patients on ventilator support (cited source)
      critical: true,
      position: { x: 380, y: 230 },
    },
  ],
  edges: [
    { id: 'e-main-genA', source: 'utility-main-feed', target: 'generator-a', loadTransferRatio: 0.55, secondaryEffectMultiplier: 1.0, active: true },
    { id: 'e-main-genB', source: 'utility-main-feed', target: 'generator-b', loadTransferRatio: 0.45, secondaryEffectMultiplier: 1.0, active: true },
    { id: 'e-genA-ward', source: 'generator-a', target: 'general-ward-load', loadTransferRatio: 1.0, secondaryEffectMultiplier: 1.0, active: true },
    { id: 'e-genB-icu', source: 'generator-b', target: 'icu-ventilator-load', loadTransferRatio: 1.0, secondaryEffectMultiplier: 1.0, active: true },
  ],
  initialEvent: {
    id: 'evt-main-cable-fire',
    name: 'Main HT Cable Fire',
    type: 'Feeder Trip',
    nodeId: 'utility-main-feed',
    nodeName: 'Main Incoming HT Cable/Feed',
    severity: 'Critical',
    detectedAt: new Date().toISOString(),
    confidence: 1,
    currentObservedValue: 420,
    normalRange: [0, 440],
    deltaPercentage: 0,
    history: [],
  },
  trueEnvironment: {
    trueCapacity: {
      'utility-main-feed': 440, 'generator-a': 260, 'generator-b': 220,
      'general-ward-load': 260, 'icu-ventilator-load': 220,
    },
    trueLoad: {
      'utility-main-feed': 420, 'generator-a': 10, 'generator-b': 10,
      'general-ward-load': 5, 'icu-ventilator-load': 5,
    },
    failureThreshold: {
      'utility-main-feed': 0.95, // minimal headroom, matching a cable fire tripping the main feed
      'generator-a': 0.85, // MODELLED — the compromised backup path
      'generator-b': 1.3, // MODELLED — the protected/independent path
      'general-ward-load': 0.9,
      'icu-ventilator-load': 1.3,
    },
    secondaryEffects: {},
    environmentSeed: 241117,
  },
  sensorConfig: {
    // Not used by the case-study runner (bypasses the synthetic sensor
    // layer). Present only because `Scenario` requires it.
    dropoutRate: 0,
    noiseSigma: 0,
    maxStalenessTicks: 0,
    sensorSeed: 241117,
  },
  activeSince: 'Incident night: 16–17 November 2024',
};

export const chennaiHospitalCase: CaseStudy = {
  id: 'case-chennai-hospital-kcssh-nov2024',
  name: 'Chennai Hospital Power Outage — Kalaignar Centenary Super Specialty Hospital',
  domain: 'CRITICAL_FACILITY',
  location: 'Guindy, Chennai, Tamil Nadu, India',
  description:
    'Representative model of a documented main-cable fire and generator-cable disruption at a Chennai ' +
    'super-specialty hospital, and the backup path that protected ventilator-dependent patients.',

  realIncidentSummary:
    'On the night of 16–17 November 2024, a fire broke out in the main incoming power cable at Kalaignar ' +
    'Centenary Super Specialty Hospital (KCSSH), Guindy, Chennai. The generator supply cable was also ' +
    'affected. Tamil Nadu health officials (Additional Chief Secretary Supriya Sahu; Health Minister Ma ' +
    'Subramanian) confirmed power was maintained to all 419 patients present, including 15 on ventilator ' +
    'support, through a separate backup generator, and full power was restored within about an hour using ' +
    'an alternate HT cable as an interim measure. Follow-up reporting states the power distribution utility ' +
    'directed inspection of service cables/equipment at other government hospitals.',

  expectedObservedMechanism:
    'The hospital\'s main incoming cable failed (fire); the generator cable normally intended to back it up ' +
    'was also affected by the same fire. Critical-care/ventilator patients were kept powered because they ' +
    'were served by a separate, independent generator path unaffected by the fault, while other patients ' +
    'experienced the outage until power was restored via an alternate cable.',

  evidence: [
    {
      id: EVIDENCE_REPUBLIC_WORLD,
      title: 'Sudden Power Outage in Chennai Hospital Triggers Panic Among Patients',
      organization: 'Republic World',
      url: 'https://www.republicworld.com/india/sudden-power-outage-in-chennai-hospital-triggers-panic-among-patients',
      datePublished: '2024-11-17',
      dateAccessed: '2026-09-02',
      supports:
        'Hospital identity (KCSSH, Guindy); fire in main cable and generator cable; 419 patients including ' +
        '15 on ventilator support kept powered via a separate generator; official statements; restoration timeline.',
      verificationMethod: 'direct-read', // fetched directly this session; content confirmed to match
    },
    {
      id: EVIDENCE_DT_NEXT,
      title: "Kalaignar Centenary hospital power outage: 'Check service cable and equipment health in all GHs', directs TNPDCL",
      organization: 'DT Next',
      url: 'https://www.dtnext.in/news/chennai/kalaignar-centenary-hospital-power-outage-check-service-cable-and-equipment-health-in-all-ghs-directs-tnpdcl-812571',
      dateAccessed: '2026-09-02',
      supports: 'Follow-up directive to inspect service cables/equipment at government hospitals after the incident.',
      verificationMethod: 'direct-read', // fetched directly this session; content confirmed to match
    },
  ],

  verifiedFacts: [
    { statement: 'A fire in the main incoming power cable at KCSSH, Guindy, Chennai occurred on the night of 16–17 November 2024, and also affected the generator supply cable.', classification: 'VERIFIED', evidenceIds: [EVIDENCE_REPUBLIC_WORLD] },
    { statement: '419 patients were present at the time, including 15 on ventilator support.', classification: 'VERIFIED', evidenceIds: [EVIDENCE_REPUBLIC_WORLD] },
    { statement: 'Critical-care/ventilator patients were kept powered via a separate generator and were not affected; power was restored within about an hour via an alternate HT cable.', classification: 'VERIFIED', evidenceIds: [EVIDENCE_REPUBLIC_WORLD] },
    { statement: 'The power distribution utility (TNPDCL) directed inspection of service cables and equipment at government hospitals following the incident.', classification: 'VERIFIED', evidenceIds: [EVIDENCE_DT_NEXT] },
  ],

  modeledAssumptions: [
    { statement: 'The hospital\'s real electrical one-line diagram is private/unpublished; the two-generator, two-load network here is a representative reconstruction of the documented failure/protection mechanism only.', classification: 'MODELLED' },
    { statement: 'All node capacities, baseline loads, redundancy factors, and failure-threshold ratios are representative placeholders, not measured electrical values.', classification: 'MODELLED' },
    { statement: 'populationWeight on the two patient-load nodes (404 general / 15 ICU) is grounded in the cited 419-total / 15-ventilator counts, split as 419-15=404 for the general ward.', classification: 'MODELLED' },
    { statement: 'CASCADE\'s propagation engine models cascading failure via load-overload thresholds; the real "backup path lost its own cable" mechanism is approximated here as a downstream overload cascade, not the hospital\'s actual protection/transfer-switch logic.', classification: 'MODELLED' },
    {
      statement:
        'Phase 1.1 reroute-realism review: unlike the Tamil Nadu and data-center cases, this network was ' +
        'deliberately NOT retuned to force a partial reroute outcome. Generator B\'s ample spare capacity is ' +
        'the documented "separate protected line that held" — artificially shrinking it to manufacture a ' +
        'partial failure would contradict the verified incident (critical-care/ventilator patients were, in ' +
        'fact, not affected). Reroute remaining fully effective here is the historically faithful result.',
      classification: 'MODELLED',
    },
  ],

  network,
  initiatingContingency: {
    nodeId: 'utility-main-feed',
    description: 'Failure of the main incoming HT cable/feed, representing the documented main-cable fire.',
    classification: 'MODELLED',
  },
  availableInterventions: ['reroute', 'isolate', 'crew'],
  // Phase 2: the domain's full 5-action set (see domainActions.ts). Of
  // these, transfer-critical-load, backup-generation, and
  // restore-primary-supply are SUPPORTED_BY_CURRENT_ENGINE (mapped to the
  // existing reroute/isolate/crew mechanisms respectively);
  // activate-alternate-feed and shed-noncritical-load are REQUIRES_DOMAIN_SOLVER.
  domainActionIds: ['transfer-critical-load', 'activate-alternate-feed', 'backup-generation', 'shed-noncritical-load', 'restore-primary-supply'],
  counterfactualQuestions: [
    'If load from the failed main feed is proactively rerouted in a balanced way across both backup generator paths, does the general-ward outage get contained?',
    'Does isolating the faulted main cable prevent the cascade from reaching the general-ward load, and at what cost?',
    'Is a maintenance crew dispatch (mirroring the real interim alternate-HT-cable measure) fast enough relative to projected time-to-failure to avoid an outage entirely?',
  ],
};
