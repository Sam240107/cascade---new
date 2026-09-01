/**
 * Case Study 3 — Data Center UPS Cascade
 * ---------------------------------------------------------------------------
 * Domain: DATA_CENTER
 *
 * REAL INCIDENT (VERIFIED, cited below): Patterson & Dewar Engineers (P&D)
 * published a documented data-center electrical-disturbance case study
 * (13 Feb 2026, author Brandon Sedgwick, PE) describing: a fault condition
 * that caused a primary UPS to attempt an unintended transfer; load from
 * that path being picked up by a backup/redundant UPS through multiple
 * static transfer switches simultaneously; the backup UPS becoming severely
 * overloaded (documented at ~236% of its rated capacity) from simultaneous
 * capacitor-recharge inrush; and a brief (~24–27 ms) voltage disturbance/
 * partial de-energization of some critical loads before the system
 * stabilized. The case study is published without naming the specific
 * facility or exact incident date.
 *
 * We do NOT have that facility's private electrical topology. Every node/
 * edge/capacity value below is a MODELLED, representative reconstruction of
 * the documented dependency chain (primary UPS -> backup UPS -> critical IT
 * load, with standby generator support), clearly labeled as such — see
 * `modeledAssumptions`. Only the ~236% overload multiplier is a directly
 * cited figure.
 */

import { CaseStudy } from './types';
import { Scenario } from '../types/domain';

const EVIDENCE_PD_ENGINEERS = 'ev-pd-engineers-ups-case';

const network: Scenario = {
  id: 'case-datacenter-ups-cascade',
  name: 'Primary-to-Backup UPS Overload (Representative)',
  category: 'DATA_CENTER',
  description:
    'Representative model of a documented primary-UPS fault cascading into backup-UPS overload before ' +
    'generator takeover, reconstructed from a published engineering case study only.',
  seed: 260213,
  nodes: [
    {
      id: 'utility-feed',
      name: 'Utility Power Feed',
      type: 'substation',
      capacity: 1000,
      currentLoad: 500,
      redundancyFactor: 0.6,
      populationWeight: 0,
      critical: false,
      position: { x: 40, y: 160 },
    },
    {
      id: 'primary-ups',
      name: 'Primary UPS (control-board fault triggers unintended transfer)',
      type: 'substation',
      capacity: 500, // MODELLED — representative rated capacity (kW-equivalent)
      currentLoad: 400,
      redundancyFactor: 0.4,
      populationWeight: 0,
      critical: true,
      position: { x: 200, y: 100 },
    },
    {
      id: 'backup-ups',
      name: 'Backup/Redundant UPS',
      type: 'substation',
      // MODELLED — representative rated capacity (kW-equivalent), Phase 1.1
      // reroute-realism fix: reduced from an earlier, unrealistically
      // generous 400 kW (matching the primary UPS's own capacity, i.e.
      // full 1:1 redundancy) to 40 kW. Real backup/redundant UPS units are
      // frequently sized for a PARTIAL/priority load share rather than 1:1
      // full-load redundancy — and the cited source's own finding is
      // precisely that this backup path was NOT sized for the full
      // transferred load (it overloaded to ~236% of its rating). Modeling
      // it as comparatively small is what makes that documented finding
      // reproducible here, rather than contradicting it.
      capacity: 40,
      currentLoad: 20, // idle standby draw
      redundancyFactor: 0.3,
      populationWeight: 0,
      critical: true,
      position: { x: 200, y: 220 },
    },
    {
      id: 'generator',
      name: 'Standby Diesel Generator',
      type: 'power_plant',
      capacity: 450,
      currentLoad: 0, // not yet started — generator takeover happens after the disturbance window
      redundancyFactor: 0.9,
      populationWeight: 0,
      critical: false,
      position: { x: 40, y: 260 },
    },
    {
      id: 'critical-it-load',
      name: 'Critical IT Load (Servers & PDUs)',
      type: 'industrial', // closest available InfrastructureNodeType to a data-center compute load
      capacity: 500,
      currentLoad: 380,
      redundancyFactor: 0.2,
      populationWeight: 1200, // MODELLED — representative count of dependent digital services/workloads, NOT literal population
      critical: true,
      position: { x: 380, y: 160 },
      label: 'Critical IT Load (Servers & PDUs)',
    },
  ],
  edges: [
    { id: 'e-utility-primary', source: 'utility-feed', target: 'primary-ups', loadTransferRatio: 1.0, secondaryEffectMultiplier: 1.0, active: true },
    // 2.36 directly encodes the cited "~236% of the backup UPS rating" capacitor-inrush overload figure.
    { id: 'e-primary-backup', source: 'primary-ups', target: 'backup-ups', loadTransferRatio: 0.95, secondaryEffectMultiplier: 2.36, active: true },
    { id: 'e-backup-critical', source: 'backup-ups', target: 'critical-it-load', loadTransferRatio: 1.0, secondaryEffectMultiplier: 1.05, active: true },
    { id: 'e-generator-critical', source: 'generator', target: 'critical-it-load', loadTransferRatio: 0.4, secondaryEffectMultiplier: 1.0, active: true },
  ],
  initialEvent: {
    id: 'evt-primary-ups-fault',
    name: 'Primary UPS Control-Board Fault / Unintended Transfer',
    type: 'Cascading Overload',
    nodeId: 'primary-ups',
    nodeName: 'Primary UPS (control-board fault triggers unintended transfer)',
    severity: 'Critical',
    detectedAt: new Date().toISOString(),
    confidence: 1,
    currentObservedValue: 400,
    normalRange: [0, 500],
    deltaPercentage: 0,
    history: [],
  },
  trueEnvironment: {
    trueCapacity: {
      'utility-feed': 1000, 'primary-ups': 500, 'backup-ups': 40, 'generator': 450, 'critical-it-load': 500,
    },
    trueLoad: {
      'utility-feed': 500, 'primary-ups': 400, 'backup-ups': 20, 'generator': 0, 'critical-it-load': 380,
    },
    failureThreshold: {
      'utility-feed': 1.3,
      // 0.75 * 500 = 375 < 400 currentLoad -> the unit is already operating
      // past a safe margin at baseline. Phase 1.1 reroute-realism fix:
      // lowered from 0.92 (which left the unit under-threshold even before
      // any event, making the reroute intervention trivially always
      // succeed). The documented control-board fault is modeled as
      // degrading the UPS's effective safe capacity below its nameplate
      // rating, not merely adding load.
      'primary-ups': 0.75,
      'backup-ups': 1.0, // at rated capacity — matches the documented "236% of rating" overload framing
      'generator': 1.2,
      'critical-it-load': 1.0,
    },
    secondaryEffects: {},
    environmentSeed: 260213,
  },
  sensorConfig: {
    // Not used by the case-study runner (bypasses the synthetic sensor
    // layer). Present only because `Scenario` requires it.
    dropoutRate: 0,
    noiseSigma: 0,
    maxStalenessTicks: 0,
    sensorSeed: 260213,
  },
  activeSince: 'Published case study (undated facility incident)',
};

export const dataCenterUpsCase: CaseStudy = {
  id: 'case-datacenter-ups-cascade',
  name: 'Data Center UPS Cascade — Primary-to-Backup Overload',
  domain: 'DATA_CENTER',
  location: 'Unnamed facility (published engineering case study)',
  description:
    'Representative model of a documented UPS fault cascading into backup-UPS overload before generator takeover.',

  realIncidentSummary:
    'Patterson & Dewar Engineers (P&D) published a data-center electrical-disturbance case study (13 Feb ' +
    '2026, author Brandon Sedgwick, PE) describing a control-board fault that caused a primary UPS to ' +
    'misinterpret breaker status and attempt an unintended transfer. Load was picked up by a backup/' +
    'redundant UPS through multiple static transfer switches simultaneously; the backup UPS became ' +
    'severely overloaded — documented at approximately 236% of its rated capacity — from simultaneous ' +
    'server power-supply capacitor-recharge inrush, forcing an out-of-phase transfer to static bypass. The ' +
    'event produced brief (~24–27 ms) voltage disturbances and partial de-energization of some critical ' +
    'loads before the system stabilized ahead of generator takeover. The facility is not named in the ' +
    'published case study.',

  expectedObservedMechanism:
    'A fault in the primary UPS control path forces an unintended transfer; the backup UPS, sized for ' +
    'normal redundant operation, is not sized for the simultaneous inrush of the entire transferred load ' +
    'and becomes overloaded, itself faulting to bypass and producing a brief power disturbance to ' +
    'downstream critical IT load before the standby generator can take over.',

  evidence: [
    {
      id: EVIDENCE_PD_ENGINEERS,
      title: 'Unraveling the Chaos: What We Learned from a Data Center Electrical Disturbance',
      organization: 'Patterson & Dewar Engineers (P&D)',
      url: 'https://pd-engineers.com/unraveling-the-chaos-what-we-learned-from-a-data-center-electrical-disturbance/',
      datePublished: '2026-02-13',
      dateAccessed: '2026-09-02',
      supports:
        'Primary UPS control-board fault mechanism; simultaneous static-transfer-switch load pickup; backup ' +
        'UPS overload at ~236% of rated capacity; ~24–27 ms disturbance window; author/publication attribution.',
      verificationMethod: 'direct-read', // fetched directly this session; content confirmed to match
    },
  ],

  verifiedFacts: [
    { statement: 'A control-board fault caused a primary UPS to misinterpret breaker status and attempt an unintended transfer.', classification: 'VERIFIED', evidenceIds: [EVIDENCE_PD_ENGINEERS] },
    { statement: 'Load was picked up by a backup/redundant UPS through multiple static transfer switches simultaneously.', classification: 'VERIFIED', evidenceIds: [EVIDENCE_PD_ENGINEERS] },
    { statement: 'The backup UPS became overloaded at approximately 236% of its rated capacity from simultaneous capacitor-recharge inrush.', classification: 'VERIFIED', evidenceIds: [EVIDENCE_PD_ENGINEERS] },
    { statement: 'The event produced a brief (~24–27 ms) voltage disturbance and partial de-energization of some critical loads before stabilizing.', classification: 'VERIFIED', evidenceIds: [EVIDENCE_PD_ENGINEERS] },
  ],

  modeledAssumptions: [
    { statement: 'The published case study does not name the facility, disclose its real topology, or give exact node-level capacities; the 5-node network here is a representative reconstruction of the documented dependency chain only.', classification: 'MODELLED' },
    { statement: 'All node capacities and baseline loads (utility feed, UPS ratings, generator, IT load) are representative placeholders, not the real facility\'s measured values.', classification: 'MODELLED' },
    { statement: 'The primary-UPS-to-backup-UPS edge\'s secondaryEffectMultiplier of 2.36 is the one figure directly grounded in the cited source (~236% of backup UPS rating); all other edge ratios/multipliers are representative.', classification: 'MODELLED' },
    { statement: 'populationWeight on the IT load node represents a notional count of dependent digital services/workloads for illustrative service-impact purposes, not literal population.', classification: 'MODELLED' },
    {
      statement:
        'Phase 1.1 reroute-realism fix: backup-ups capacity was reduced from an earlier, unrealistically ' +
        'generous 400 kW (equal to the primary UPS, implying full 1:1 redundancy) to 40 kW, and primary-ups\' ' +
        'failureThreshold ratio was lowered from 0.92 to 0.75 (395 threshold and 460 threshold from that ' +
        'ratio, respectively, put it under baseline load, meaning reroute could always fully save it). With ' +
        'these more realistic, tighter values, rerouting the primary UPS\'s load still overloads the backup ' +
        'UPS and downstream IT load in this model — echoing the cited source\'s own finding that the backup ' +
        'path was not sized for the full transferred load.',
      classification: 'MODELLED',
    },
  ],

  network,
  initiatingContingency: {
    nodeId: 'primary-ups',
    description: 'Control-board fault on the primary UPS triggering an unintended transfer, representing the documented failure trigger.',
    classification: 'MODELLED',
  },
  availableInterventions: ['reroute', 'isolate', 'crew'],
  // Phase 2: the domain's full 5-action set (see domainActions.ts). Of
  // these, ups-transfer, generator-takeover, and redundant-path-restoration
  // are SUPPORTED_BY_CURRENT_ENGINE (mapped to the existing reroute/isolate/
  // crew mechanisms respectively); load-shedding and workload-migration are
  // REQUIRES_DOMAIN_SOLVER.
  domainActionIds: ['ups-transfer', 'load-shedding', 'workload-migration', 'generator-takeover', 'redundant-path-restoration'],
  counterfactualQuestions: [
    'If the primary UPS\'s load is proactively rerouted across both the backup UPS and generator paths before failure, does the backup-UPS overload get contained?',
    'Does isolating the faulted primary UPS prevent the overload from reaching the backup UPS and critical IT load, and at what cost?',
    'Is a facilities/engineering crew response fast enough relative to projected time-to-failure to avoid the disturbance entirely?',
  ],
};
