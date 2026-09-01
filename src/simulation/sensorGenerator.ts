import { Scenario, Observation, ObservedNode, SensorConfig, DataQualityTier } from '../types/domain';
import { DeterministicPRNG } from './prng';

export class SensorGenerator {
  static generateObservation(scenario: Scenario, configOverride?: Partial<SensorConfig>): Observation {
    const config: SensorConfig = {
      ...scenario.sensorConfig,
      ...configOverride,
    };

    const rng = new DeterministicPRNG(config.sensorSeed ^ scenario.seed);
    const observedNodes: Record<string, ObservedNode> = {};

    let goodCount = 0;
    let fairCount = 0;
    let poorCount = 0;

    for (const node of scenario.nodes) {
      const trueCap = scenario.trueEnvironment.trueCapacity[node.id] ?? node.capacity;
      const trueLd = scenario.trueEnvironment.trueLoad[node.id] ?? node.currentLoad;

      const isDropped = rng.next() < config.dropoutRate;
      const isStale = rng.next() < 0.12;
      const noise = rng.nextGaussian(0, config.noiseSigma);

      let observedLoad = trueLd + noise;
      if (observedLoad < 0) observedLoad = 0;

      let quality: DataQualityTier = 'good';
      let confidence = 0.94;

      if (isDropped) {
        quality = 'poor';
        confidence = 0.45;
        poorCount++;
      } else if (isStale) {
        quality = 'fair';
        confidence = 0.72;
        fairCount++;
      } else {
        goodCount++;
      }

      const stress = Math.min(1.5, Math.max(0, observedLoad / trueCap));

      // Calculate initial estimated Time to Failure (minutes)
      let timeToFailureMinutes = 999;
      if (stress >= 0.90) {
        timeToFailureMinutes = Math.max(3, Math.round(6 + (1.0 - stress) * 15 + rng.nextInt(-1, 1)));
      } else if (stress >= 0.70) {
        timeToFailureMinutes = Math.max(8, Math.round(15 + (0.9 - stress) * 30 + rng.nextInt(-2, 2)));
      } else if (stress >= 0.50) {
        timeToFailureMinutes = Math.max(25, Math.round(45 + (0.7 - stress) * 60));
      }

      observedNodes[node.id] = {
        id: node.id,
        name: node.name,
        type: node.type,
        observedLoad: Math.round(observedLoad * 10) / 10,
        observedCapacity: trueCap,
        stress,
        dataQuality: quality,
        isStale,
        isMissing: isDropped,
        timeToFailureMinutes,
        confidence,
        critical: node.critical,
        populationWeight: node.populationWeight,
        position: node.position,
      };
    }

    const totalNodes = scenario.nodes.length;
    const overallDataQuality = Math.round(((goodCount * 1.0 + fairCount * 0.6 + poorCount * 0.2) / totalNodes) * 100);

    return {
      nodes: observedNodes,
      edges: scenario.edges,
      events: [scenario.initialEvent],
      overallDataQuality,
      qualityBreakdown: {
        good: Math.round((goodCount / totalNodes) * 100),
        fair: Math.round((fairCount / totalNodes) * 100),
        poor: Math.round((poorCount / totalNodes) * 100),
      },
      timestamp: scenario.activeSince,
      isRealtimeConnected: false,
    };
  }
}
