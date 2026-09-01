/**
 * caseStudyObservationAdapter.ts
 * ---------------------------------------------------------------------------
 * Phase 3 — UI integration glue.
 *
 * Several existing UI components (NetworkCard, EventsPage, RiskPage via
 * RiskCalculator, SimulationPage's "before" stress column, ...) are written
 * against the `Observation` shape that the sensor layer's `generateObservation`
 * normally produces. Case studies must NOT call SensorGenerator — that layer
 * exists to emulate noisy/dropped LIVE telemetry, which would misrepresent a
 * documented historical/representative case as fake "live" sensor data.
 *
 * This file is the honest alternative: it builds an `Observation`-shaped
 * object DIRECTLY from a case study's own modelled ground truth (via the
 * existing, unmodified `buildEnvironmentFromScenario`), with zero noise,
 * zero dropout, full confidence, and `isRealtimeConnected: false` — so any
 * existing component that renders an `Observation` keeps working unchanged,
 * while remaining honest that this is a MODELLED snapshot, not a live read.
 *
 * This is presentation-layer reshaping, not simulation: every number it
 * copies (load, capacity, stress, ground-truth time-to-failure) already
 * exists on the case's own `Scenario`/`SimEnvironment` — nothing here
 * computes a cascade, disruption, containment, or recommendation.
 */

import { Scenario, Observation, ObservedNode } from '../types/domain';
import { buildEnvironmentFromScenario } from '../simulation/propagationEngine';

export function buildGroundTruthObservation(scenario: Scenario): Observation {
  const env = buildEnvironmentFromScenario(scenario);

  const nodes: Record<string, ObservedNode> = {};
  for (const node of scenario.nodes) {
    const simNode = env.nodes[node.id];
    const observedCapacity = simNode?.capacity ?? node.capacity;
    const observedLoad = simNode?.currentLoad ?? node.currentLoad;
    nodes[node.id] = {
      id: node.id,
      name: node.name,
      type: node.type,
      observedLoad,
      observedCapacity,
      stress: observedCapacity > 0 ? observedLoad / observedCapacity : 0,
      dataQuality: 'good',
      isStale: false,
      isMissing: false,
      timeToFailureMinutes: simNode?.timeToFailureMinutes ?? 999,
      confidence: 1,
      critical: node.critical,
      populationWeight: node.populationWeight,
      position: node.position,
    };
  }

  return {
    nodes,
    edges: scenario.edges,
    events: [scenario.initialEvent],
    overallDataQuality: 100,
    qualityBreakdown: { good: scenario.nodes.length, fair: 0, poor: 0 },
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    isRealtimeConnected: false,
  };
}
