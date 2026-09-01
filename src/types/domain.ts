/**
 * CASCADE Domain Types
 * Counterfactual Infrastructure Cascade Analysis & Decision Engine
 */

export type InfrastructureNodeType =
  | 'substation'
  | 'power_plant'
  | 'water_treatment'
  | 'hospital'
  | 'residential'
  | 'industrial';

export interface InfrastructureNode {
  id: string;
  name: string;
  type: InfrastructureNodeType;
  capacity: number;          // Nominal operating capacity (MW or Flow Units)
  currentLoad: number;       // Nominal load
  redundancyFactor: number;   // 0..1 (backup feed availability)
  populationWeight: number;   // Direct population dependent on node
  critical: boolean;          // High priority/life-safety critical
  position: {
    x: number;
    y: number;
  };
  label?: string;
  zone?: string;
}

export interface InfrastructureEdge {
  id: string;
  source: string;
  target: string;
  loadTransferRatio: number;          // Fraction of overload spilled down this branch (0..1)
  secondaryEffectMultiplier: number;  // Multiplier for secondary cascading stresses (>=1.0)
  active?: boolean;
}

/**
 * TrueEnvironment: Hidden ground truth environment.
 * CASCADE decision engine NEVER accesses this directly.
 * Only the evaluation/sensor engine interacts with it.
 */
export interface TrueEnvironment {
  trueCapacity: Record<string, number>;
  trueLoad: Record<string, number>;
  failureThreshold: Record<string, number>; // e.g. 1.05 = fails at 105% load
  secondaryEffects: Record<string, number>;
  stochasticPerturbationSchedule?: Array<{
    tick: number;
    target: string;
    magnitude: number;
  }>;
  environmentSeed: number;
}

export interface SensorConfig {
  dropoutRate: number;       // 0..1 probability of dropped sensor reading
  noiseSigma: number;        // Gaussian noise standard deviation
  maxStalenessTicks: number; // Ticks before sensor is flagged stale
  sensorSeed: number;
}

export type DataQualityTier = 'good' | 'fair' | 'poor';

export interface ObservedNode {
  id: string;
  name: string;
  type: InfrastructureNodeType;
  observedLoad: number;
  observedCapacity: number;
  stress: number;            // (observedLoad / observedCapacity)
  dataQuality: DataQualityTier;
  isStale: boolean;
  isMissing: boolean;
  timeToFailureMinutes: number;
  confidence: number;        // 0..1
  critical: boolean;
  populationWeight: number;
  position: { x: number; y: number };
}

export interface SensorEvent {
  id: string;
  name: string;
  type: 'Load Spike' | 'Cooling Failure' | 'Line Sag' | 'Feeder Trip' | 'Cascading Overload';
  nodeId: string;
  nodeName: string;
  severity: 'Critical' | 'High' | 'Moderate' | 'Low';
  detectedAt: string;
  confidence: number;
  currentObservedValue: number;
  normalRange: [number, number];
  deltaPercentage: number;
  history: Array<{ time: string; observed: number; normal: number }>;
}

export interface Observation {
  nodes: Record<string, ObservedNode>;
  edges: InfrastructureEdge[];
  events: SensorEvent[];
  overallDataQuality: number; // 0..100
  qualityBreakdown: {
    good: number;
    fair: number;
    poor: number;
  };
  timestamp: string;
  isRealtimeConnected: boolean;
}

export interface RiskScoreWeights {
  w1_stress: number;
  w2_inverseTimeToFailure: number;
  w3_redundancyRisk: number;
  w4_loadTransferExposure: number;
}

export interface RiskScore {
  nodeId: string;
  nodeName: string;
  nodeType: InfrastructureNodeType;
  score: number; // 0..1
  level: 'critical' | 'high' | 'moderate' | 'low' | 'healthy';
  confidence: number;
  timeToFailureMinutes: number;
  blastRadiusNodes: number;
  populationExposure: number;
  criticalFacilitiesCount: number;
  critical: boolean;
  breakdown: {
    stressContribution: number;
    timeToFailureContribution: number;
    redundancyContribution: number;
    transferContribution: number;
  };
}

export interface BlastRadius {
  originNodeId: string;
  affectedNodeIds: string[];
  downstreamNodeIds: string[];
  populationExposure: number;
  criticalFacilities: number;
  propagationDepth: number;
  totalUnmetLoad: number;
}

export type InterventionType = 'reroute' | 'isolate' | 'crew';

export interface CandidateAction {
  id: string;
  type: InterventionType;
  title: string;
  description: string;
  targetNodeId: string;
  targetNodeName: string;
  parameters: {
    targetPaths?: string[];
    isolatedNodeIds?: string[];
    crewEtaMinutes?: number;
  };
}

export interface SimulationResult {
  actionId: string;
  actionType: InterventionType;
  title: string;
  description: string;
  isEffective: boolean;
  containmentRate: number; // e.g. 94%
  containmentLabel: 'YES' | 'NO';
  populationImpact: number;
  criticalFacilitiesImpact: number;
  disruptionScore: number;
  nodesStressAfter: Record<string, number>; // nodeId -> stress %
  affectedNodeCount: number;
  propagationPath: string[];
  details: {
    downtimeHours: number;
    spareCapacityUsed: number;
    overflowProduced: number;
    crewEtaMinutes?: number;
    rationale: string;
  };
}

export interface Recommendation {
  actionId: string;
  actionType: InterventionType;
  title: string;
  reason: string;
  disruptionScore: number;
  containmentPercentage: number;
  populationImpact: number;
  criticalFacilityImpact: number;
  confidencePercentage: number;
  effectiveAlternatives: SimulationResult[];
  rejectedAlternatives: SimulationResult[];
  explanationSummary: string;
  auditTrail: {
    scenarioId: string;
    evaluatedAt: string;
    evaluatedActionsCount: number;
    decisionRule: string;
  };
}

export interface VerificationResult {
  status: 'PASSED' | 'FAILED' | 'PENDING';
  independentPerturbation: {
    eventType: string;
    targetNodeId: string;
    targetNodeName: string;
    magnitude: number;
    seed: number;
  };
  postFixContainment: 'contained' | 'not contained';
  reCascadeRate: string; // e.g. "0/10 (0%)"
  reCascadePercentage: number;
  testsConducted: number;
  testsPassed: number;
  affectedNodesCount: number;
  populationImpact: number;
  criticalFacilities: number;
  details: string;
  timestamp: string;
}

export interface ImpactSummary {
  metrics: Array<{
    id: string;
    name: string;
    withoutCascade: number;
    withCascade: number;
    difference: number;
    percentageDelta: string;
    unit?: string;
  }>;
}

export interface Scenario {
  id: string;
  name: string;
  category: string;
  description: string;
  seed: number;
  nodes: InfrastructureNode[];
  edges: InfrastructureEdge[];
  initialEvent: SensorEvent;
  trueEnvironment: TrueEnvironment;
  sensorConfig: SensorConfig;
  activeSince: string;
}

export interface PolicyMetrics {
  policyName: string;
  containmentRate: number;         // 0..100%
  weightedDisruption: number;      // mean score
  top1Recall: number;              // % optimal
  top3Recall: number;              // % in top 3
  falsePositiveRate: number;       // %
  meanRegret: number;              // score diff
  meanNormalizedRegret: number;    // 0..1
  reCascadeRate: number;           // %
  falseContainmentRate: number;    // %
  scenariosTested: number;
}

export interface BenchmarkResult {
  isExecuted: boolean;
  executionTimestamp?: string;
  scenarioCount: number;
  seed: number;
  policies: {
    cascade: PolicyMetrics;
    greedyLocal: PolicyMetrics;
    isolateFirst: PolicyMetrics;
  };
  regretAnalysis: {
    meanRegret: number;
    meanNormalizedRegret: number;
    optimalSelectionRate: number;
  };
}

/**
 * ---------------------------------------------------------------------------
 * Ground-truth simulation types (propagationEngine.ts)
 * ---------------------------------------------------------------------------
 * These describe the real, mutable state of the network *while a cascade is
 * being simulated* — as opposed to InfrastructureNode/TrueEnvironment, which
 * only describe the scenario's static, predefined starting conditions.
 * The propagation engine builds a SimEnvironment from a Scenario, then
 * mutates a clone of it as failures and load transfers occur.
 */

/** Why a given node ended up in the failedNodes list. */
export type FailureCause =
  | 'initial_event'      // the node named by the scenario's initiating event
  | 'overload_cascade'   // failed because redistributed load pushed it over its threshold
  | 'service_loss';      // stranded because its only network tie ran through an isolated node

export interface SimNode {
  id: string;
  name: string;
  type: InfrastructureNodeType;
  capacity: number;
  currentLoad: number;
  redundancyFactor: number;
  populationWeight: number;
  critical: boolean;
  failureThreshold: number;      // absolute load at which the node fails (capacity * ratio)
  timeToFailureMinutes: number;  // ground-truth estimate, independent of sensor noise
  failed: boolean;
  isolated: boolean;
}

export interface SimEdge {
  source: string;
  target: string;
  loadTransferRatio: number;
  secondaryEffectMultiplier: number;
  active: boolean;
}

export interface SimEnvironment {
  nodes: Record<string, SimNode>;
  edges: SimEdge[];
  seed: number;
}

export interface PropagationStep {
  step: number;
  nodeId: string;
  nodeName: string;
  eventType: 'initial_failure' | 'overload_failure' | 'load_transfer' | 'isolation';
  cause?: FailureCause;
  loadBefore: number;
  loadAfter: number;
  stressBefore: number;
  stressAfter: number;
  description: string;
}

export interface PropagationResult {
  failedNodes: string[];
  failureCauses: Record<string, FailureCause>;
  propagationSteps: PropagationStep[];
  finalNodeStates: Record<string, { load: number; stress: number; failed: boolean; isolated: boolean }>;
  affectedNodeCount: number;
  affectedPopulation: number;
  affectedCriticalFacilities: number;
  cascadeContained: boolean;   // true iff no node failed via 'overload_cascade'
  maximumStress: number;
  cascadeDepth: number;
  totalUnmetLoad: number;      // load that could not be routed anywhere during the run
}

export interface DisruptionWeights {
  populationWeightPerPerson: number;
  downtimeWeightPerHour: number;
  criticalFacilityPenalty: number;
}

export interface DisruptionBreakdown {
  populationComponent: number;
  downtimeComponent: number;
  criticalFacilityComponent: number;
  totalDisruptionScore: number;
}

export interface EngineSettings {
  weights: RiskScoreWeights;
  stressThresholds: {
    critical: number; // 0.90
    high: number;     // 0.70
    moderate: number; // 0.50
    low: number;      // 0.30
  };
  criticalFacilityPenalty: number; // 25
  populationDowntimeWeight: number; // 0.01
  sensorConfig: SensorConfig;
  verificationRuns: number; // 10
  benchmarkMode: 'development' | 'tuning' | 'held-out';
  autoRefreshIntervalSec: number;
}
