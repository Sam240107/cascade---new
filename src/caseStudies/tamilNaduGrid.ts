/**
 * Case Study 1 — Tamil Nadu Power Grid: Kanarpatti–Tirunelveli 400kV Corridor
 * ---------------------------------------------------------------------------
 * Domain: POWER_GRID
 *
 * REAL CONTEXT (reported in public SRPC documents — NOT independently
 * confirmed by direct document read this session; see "Sourcing status"
 * below): Southern Regional Power Committee (SRPC) Operation Coordination
 * Committee (OCC) documents describe the 400kV Kanarpatti–Tirunelveli /
 * Kanarpatti–Abhishekapatti transmission corridor in southern Tamil Nadu as
 * a recurring constraint: during high renewable-generation periods the
 * single-circuit line's loading rises above ~1450 MW, at or near the line's
 * documented practical ceiling (reported elsewhere as "up to 1400 MW,
 * reaching its maximum loading"), and tripping of the line has caused 230kV
 * network overloading and renewable-generation curtailment/tripping across a
 * wide downstream area.
 *
 * SOURCING STATUS (Phase 1.1 audit fix): every SRPC PDF cited for this case
 * (`www.srpc.kar.nic.in`) failed to render directly in this session (TLS
 * certificate error, repeated across multiple attempts and multiple
 * documents on that host). The facts below therefore rest on a search
 * engine's own snippet synthesis of those documents, not a direct read —
 * they are classified UNCONFIRMED_SECONDARY_EXTRACTION, not VERIFIED. A
 * prior version of this file cited a second document
 * (`58SRPCAGUpload.pdf`, hosted on `srpc.gov.in`) specifically for the SPS/
 * PGCIL–TANTRANSCO claim; that document WAS directly readable, but its
 * content did not, on direct read, contain anything supporting that claim.
 * That citation has been removed rather than left mis-attributed — do not
 * re-add it without confirming the document actually supports the claim.
 *
 * We do NOT have TANTRANSCO/PGCIL's private grid topology, protection
 * settings, or exact per-substation load figures. Every node/edge value
 * below is a MODELLED, representative reconstruction built only from the
 * documented relationships (corridor -> downstream 230kV areas), clearly
 * labeled as such — see `modeledAssumptions`.
 */

import { CaseStudy } from './types';
import { Scenario } from '../types/domain';

const EVIDENCE_SRPC_OCC_231 = 'ev-srpc-occ-231';

const network: Scenario = {
  id: 'case-tn-power-grid-tirunelveli-corridor',
  name: 'Kanarpatti–Tirunelveli 400kV Corridor (Representative)',
  category: 'POWER_GRID',
  description:
    'Representative model of the documented Kanarpatti–Tirunelveli/Abhishekapatti 400kV transmission ' +
    'constraint and its downstream 230kV network, reconstructed from public SRPC documents only.',
  seed: 421101,
  nodes: [
    {
      id: 'wind-cluster',
      name: 'Tirunelveli–Tuticorin Wind Generation Cluster',
      type: 'power_plant',
      capacity: 1800, // MODELLED — representative MW; real aggregate wind capacity is private/utility data
      currentLoad: 1450, // background/steady-state loading context reported for high-RE periods — NOT a trip-instant measurement (see modeledAssumptions)
      redundancyFactor: 0.1, // MODELLED — reflects the documented single-circuit exposure
      populationWeight: 0,
      critical: false,
      position: { x: 40, y: 260 },
      zone: 'Tirunelveli/Tuticorin',
    },
    {
      id: 'kanarpatti-400kv',
      name: 'Kanarpatti 400kV Substation (corridor injection point)',
      type: 'substation',
      // MODELLED capacity, tied to the reported practical ceiling ("up to
      // 1400 MW, reaching its maximum loading") rather than an arbitrary
      // inflated figure — see modeledAssumptions (Phase 1.1 reroute-realism fix).
      capacity: 1460,
      currentLoad: 1450, // background/steady-state loading context — NOT a trip-instant measurement (see modeledAssumptions)
      redundancyFactor: 0.15, // MODELLED — low, matching the documented single-circuit vulnerability
      populationWeight: 0,
      critical: true,
      position: { x: 160, y: 220 },
      zone: 'Tirunelveli',
    },
    // Downstream 230kV areas named explicitly in the SRPC documentation as
    // affected by tripping of the corridor. Per-area capacity/load/
    // population figures are MODELLED — the real per-substation breakdown
    // is not public. Utilization tightened in Phase 1.1 (~80-85% loaded,
    // vs. an earlier, unrealistically generous ~65-70%) — see modeledAssumptions.
    { id: 'chennai-230kv', name: 'Chennai 230kV Area', type: 'substation', capacity: 300, currentLoad: 250, redundancyFactor: 0.35, populationWeight: 180, critical: true, position: { x: 420, y: 60 }, zone: 'Chennai' },
    { id: 'arasur-230kv', name: 'Arasur 230kV Area', type: 'substation', capacity: 225, currentLoad: 190, redundancyFactor: 0.3, populationWeight: 90, critical: false, position: { x: 400, y: 120 }, zone: 'Arasur' },
    { id: 'trichy-230kv', name: 'Trichy 230kV Area', type: 'substation', capacity: 240, currentLoad: 200, redundancyFactor: 0.3, populationWeight: 110, critical: true, position: { x: 320, y: 180 }, zone: 'Trichy' },
    { id: 'madurai-230kv', name: 'Madurai 230kV Area', type: 'substation', capacity: 245, currentLoad: 205, redundancyFactor: 0.3, populationWeight: 100, critical: false, position: { x: 260, y: 260 }, zone: 'Madurai' },
    { id: 'karaikudi-230kv', name: 'Karaikudi 230kV Area', type: 'substation', capacity: 190, currentLoad: 160, redundancyFactor: 0.25, populationWeight: 60, critical: false, position: { x: 340, y: 260 }, zone: 'Karaikudi' },
    { id: 'neyveli-230kv', name: 'Neyveli 230kV Area', type: 'substation', capacity: 205, currentLoad: 175, redundancyFactor: 0.25, populationWeight: 70, critical: false, position: { x: 380, y: 200 }, zone: 'Neyveli' },
    { id: 'hosur-230kv', name: 'Hosur 230kV Area', type: 'substation', capacity: 200, currentLoad: 170, redundancyFactor: 0.25, populationWeight: 65, critical: false, position: { x: 300, y: 60 }, zone: 'Hosur' },
  ],
  edges: [
    { id: 'e-wind-kanarpatti', source: 'wind-cluster', target: 'kanarpatti-400kv', loadTransferRatio: 1.0, secondaryEffectMultiplier: 1.0, active: true },
    { id: 'e-kanarpatti-chennai', source: 'kanarpatti-400kv', target: 'chennai-230kv', loadTransferRatio: 0.2, secondaryEffectMultiplier: 1.1, active: true },
    { id: 'e-kanarpatti-arasur', source: 'kanarpatti-400kv', target: 'arasur-230kv', loadTransferRatio: 0.14, secondaryEffectMultiplier: 1.1, active: true },
    { id: 'e-kanarpatti-trichy', source: 'kanarpatti-400kv', target: 'trichy-230kv', loadTransferRatio: 0.15, secondaryEffectMultiplier: 1.15, active: true },
    { id: 'e-kanarpatti-madurai', source: 'kanarpatti-400kv', target: 'madurai-230kv', loadTransferRatio: 0.15, secondaryEffectMultiplier: 1.1, active: true },
    { id: 'e-kanarpatti-karaikudi', source: 'kanarpatti-400kv', target: 'karaikudi-230kv', loadTransferRatio: 0.12, secondaryEffectMultiplier: 1.1, active: true },
    { id: 'e-kanarpatti-neyveli', source: 'kanarpatti-400kv', target: 'neyveli-230kv', loadTransferRatio: 0.12, secondaryEffectMultiplier: 1.1, active: true },
    { id: 'e-kanarpatti-hosur', source: 'kanarpatti-400kv', target: 'hosur-230kv', loadTransferRatio: 0.12, secondaryEffectMultiplier: 1.1, active: true },
  ],
  initialEvent: {
    id: 'evt-kanarpatti-trip',
    name: 'Kanarpatti 400kV Corridor Trip',
    type: 'Feeder Trip',
    nodeId: 'kanarpatti-400kv',
    nodeName: 'Kanarpatti 400kV Substation (corridor injection point)',
    severity: 'Critical',
    detectedAt: new Date().toISOString(),
    confidence: 1,
    currentObservedValue: 1450, // mirrors trueLoad below — not a live sensor reading
    normalRange: [0, 1460],
    deltaPercentage: 0,
    history: [],
  },
  trueEnvironment: {
    trueCapacity: {
      'wind-cluster': 1800, 'kanarpatti-400kv': 1460,
      'chennai-230kv': 300, 'arasur-230kv': 225, 'trichy-230kv': 240,
      'madurai-230kv': 245, 'karaikudi-230kv': 190, 'neyveli-230kv': 205, 'hosur-230kv': 200,
    },
    trueLoad: {
      'wind-cluster': 1450, 'kanarpatti-400kv': 1450,
      'chennai-230kv': 250, 'arasur-230kv': 190, 'trichy-230kv': 200,
      'madurai-230kv': 205, 'karaikudi-230kv': 160, 'neyveli-230kv': 175, 'hosur-230kv': 170,
    },
    failureThreshold: {
      'wind-cluster': 1.0,
      // 0.965 * 1460 = 1409 MW, matching the reported "up to 1400 MW,
      // reaching its maximum loading" practical ceiling for this corridor.
      'kanarpatti-400kv': 0.965,
      'chennai-230kv': 1.15, 'arasur-230kv': 1.15, 'trichy-230kv': 1.15,
      'madurai-230kv': 1.15, 'karaikudi-230kv': 1.15, 'neyveli-230kv': 1.15, 'hosur-230kv': 1.15,
    },
    secondaryEffects: {},
    environmentSeed: 421101,
  },
  sensorConfig: {
    // Not used by the case-study runner (it bypasses the sensor/observation
    // layer entirely to avoid introducing synthetic "live" data). Present
    // only because `Scenario` requires it; dropout/noise are zeroed.
    dropoutRate: 0,
    noiseSigma: 0,
    maxStalenessTicks: 0,
    sensorSeed: 421101,
  },
  activeSince: 'Documented recurring constraint (SRPC OCC minutes, 2025–2026)',
};

export const tamilNaduPowerGridCase: CaseStudy = {
  id: 'case-tn-power-grid-tirunelveli-corridor',
  name: 'Tamil Nadu Transmission Contingency — Kanarpatti–Tirunelveli 400kV Corridor',
  domain: 'POWER_GRID',
  location: 'Tirunelveli region, Tamil Nadu, India (Southern Regional grid)',
  description:
    'Representative reconstruction of a documented transmission-loading constraint on the 400kV ' +
    'Kanarpatti–Tirunelveli/Abhishekapatti corridor and its downstream 230kV network.',

  realIncidentSummary:
    'Public SRPC Operation Coordination Committee documents are reported to describe the 400kV ' +
    'Kanarpatti–Tirunelveli (Kanarpatti–Abhishekapatti) single-circuit corridor carrying loading above ' +
    '~1450 MW during high renewable-generation periods, at or near its rated capacity. Tripping of this ' +
    'corridor is reported to cause 230kV network overloading/load shedding across Chennai, Arasur, Trichy, ' +
    'Madurai, Karaikudi, Neyveli and Hosur, and documented renewable-generation curtailment/tripping events ' +
    '(750 MW on 23 Aug 2025; 3900 MW on 24 Sep 2025). TANTRANSCO reportedly proposed a Special Protection ' +
    'Scheme (SPS) pending a second circuit. NOTE: these facts could not be independently confirmed by a ' +
    'direct read of the source documents this session — see "Sourcing status" in the file header and ' +
    '`verifiedFacts` classifications below.',

  expectedObservedMechanism:
    'A single 400kV circuit carries corridor-scale wind generation at/near its rated loading. When it ' +
    'trips, the power it was carrying has to find another path; the weaker downstream 230kV network is ' +
    'forced to absorb it, overloading substations across a wide geographic footprint and triggering both ' +
    'load shedding and renewable-generation curtailment/tripping to protect the grid.',

  evidence: [
    {
      id: EVIDENCE_SRPC_OCC_231,
      title: 'Agenda / Minutes for the 231st Meeting of the Operation Coordination Committee (SRPC)',
      organization: 'Southern Regional Power Committee (SRPC)',
      url: 'https://www.srpc.kar.nic.in/website/2025/meetings/occ/a231occm.pdf',
      dateAccessed: '2026-09-02',
      supports:
        '400kV Kanarpatti–Tirunelveli/Abhishekapatti corridor loading above ~1450 MW; downstream 230kV ' +
        'overloading in Chennai/Arasur/Trichy/Madurai/Karaikudi/Neyveli/Hosur; renewable curtailment of ' +
        '750 MW (23 Aug 2025) and 3900 MW (24 Sep 2025); TANTRANSCO SPS proposal at Kanarpatti substation.',
      // Every attempt to fetch this document directly (and two related SRPC
      // documents on the same host) failed with a TLS certificate error this
      // session. Content attributed to it is search-engine snippet synthesis
      // only — never independently read. Do not upgrade this to
      // 'direct-read' without actually successfully rendering the document.
      verificationMethod: 'secondary-extraction',
    },
  ],

  verifiedFacts: [
    {
      statement:
        'The 400kV Kanarpatti–Tirunelveli single-circuit line loading is reported to rise above ~1450 MW ' +
        'during high renewable-generation periods (NOT independently confirmed by direct document read).',
      classification: 'UNCONFIRMED_SECONDARY_EXTRACTION',
      evidenceIds: [EVIDENCE_SRPC_OCC_231],
    },
    {
      statement:
        'Tripping of this corridor is reported to cause 230kV network overloading/load shedding across ' +
        'Chennai, Arasur, Trichy, Madurai, Karaikudi, Neyveli and Hosur (NOT independently confirmed by ' +
        'direct document read).',
      classification: 'UNCONFIRMED_SECONDARY_EXTRACTION',
      evidenceIds: [EVIDENCE_SRPC_OCC_231],
    },
    {
      statement:
        'Renewable-generation curtailment/tripping events of 750 MW (23 Aug 2025) and 3900 MW (24 Sep ' +
        '2025) are reported in connection with this corridor (NOT independently confirmed by direct ' +
        'document read).',
      classification: 'UNCONFIRMED_SECONDARY_EXTRACTION',
      evidenceIds: [EVIDENCE_SRPC_OCC_231],
    },
    {
      statement:
        'TANTRANSCO is reported to have proposed a Special Protection Scheme (SPS) for the corridor ' +
        'pending a second circuit (NOT independently confirmed by direct document read; a prior citation ' +
        'for the SPS/PGCIL-MoU implementation status pointed to a document that, on direct read, did not ' +
        'support this claim, and has been removed — see file header).',
      classification: 'UNCONFIRMED_SECONDARY_EXTRACTION',
      evidenceIds: [EVIDENCE_SRPC_OCC_231],
    },
  ],

  modeledAssumptions: [
    { statement: 'Exact substation-level capacity/load figures for Chennai/Arasur/Trichy/Madurai/Karaikudi/Neyveli/Hosur are not public; all per-area MW values here are representative, not measured.', classification: 'MODELLED' },
    { statement: 'The real constraint is a single transmission LINE tripping; CASCADE\'s propagation engine models node-level failures, so the corridor is represented as failure of the "Kanarpatti 400kV" substation node feeding it.', classification: 'MODELLED' },
    { statement: 'populationWeight values are a small representative index of relative grid-area significance, not actual city population or customer counts.', classification: 'MODELLED' },
    { statement: 'Per-edge loadTransferRatio/secondaryEffectMultiplier values approximate relative downstream exposure; the real inter-substation power-flow distribution is utility-proprietary.', classification: 'MODELLED' },
    {
      statement:
        'currentLoad: 1450 on wind-cluster/kanarpatti-400kv represents the REPORTED background/steady-state ' +
        'loading during high-RE periods, not a measured trip-instant load (no such figure is reported). The ' +
        'corridor\'s own failureThreshold (1409 MW = 0.965 * 1460 MW capacity) is instead grounded in a ' +
        'reported practical ceiling ("up to 1400 MW, reaching its maximum loading"), so the modeled corridor ' +
        'is already operating past a safe margin at baseline — consistent with that reported framing.',
      classification: 'MODELLED',
    },
    {
      statement:
        'Phase 1.1 realism fix: downstream 230kV area capacities were tightened from an earlier, ' +
        'unrealistically generous ~65-70% utilization to a more stressed ~80-85% utilization, and the ' +
        'corridor\'s own capacity was reduced from an arbitrary 1700 MW to 1460 MW (closer to its reported ' +
        'practical ceiling). This makes the modeled reroute intervention represent a corridor genuinely ' +
        'operating near its designed protection limits, rather than one with implausibly abundant headroom.',
      classification: 'MODELLED',
    },
  ],

  network,
  initiatingContingency: {
    nodeId: 'kanarpatti-400kv',
    description:
      'Trip of the Kanarpatti 400kV corridor injection point at/near its documented ~1450 MW loading, ' +
      'representing the real single-circuit line trip reported in SRPC OCC documents.',
    classification: 'MODELLED',
  },
  // Real-world response for this domain is automatic protection/rerouting
  // (SPS, alternate switching), not a physical repair crew — 'crew' is
  // intentionally excluded from this case.
  availableInterventions: ['reroute', 'isolate'],
  counterfactualQuestions: [
    'If load on the Kanarpatti 400kV corridor is proactively rerouted before its threshold is crossed, does the downstream 230kV overload get contained?',
    'Does isolating the Kanarpatti node prevent cascading tripping across the seven downstream 230kV areas, and at what population/service cost?',
    'Under an independent secondary stress after the recommended action, does containment still hold (verification)?',
  ],
};
