/**
 * propagationEngine.ts
 * ---------------------------------------------------------------------------
 * The authoritative cascade simulator. This is the one place in CASCADE that
 * actually models how an overload spreads through the network: it is used to
 * compute the "do nothing" baseline, to evaluate every candidate
 * intervention, and to run the post-fix second-shock verification.
 *
 * Nothing in this file is an LLM call and nothing here reads observation
 * noise — it operates purely on ground-truth SimEnvironment state built from
 * a Scenario's predefined inputs (capacities, loads, thresholds, edges).
 */

import {
  Scenario,
  SimEnvironment,
  SimNode,
  PropagationResult,
  PropagationStep,
  FailureCause,
} from '../types/domain';
import { MAX_PROPAGATION_STEPS } from './modelConstants';

/** Round to one decimal place — keeps step logs and results readable without
 * hiding any precision that matters for threshold comparisons. */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Stress is always load relative to capacity, expressed as a percentage.
 * Capacity is clamped away from zero to avoid dividing by zero on malformed data. */
export function computeStressPercent(node: SimNode): number {
  const safeCapacity = Math.max(1e-6, node.capacity);
  return (Math.max(0, node.currentLoad) / safeCapacity) * 100;
}

/**
 * Ground-truth time-to-failure estimate (minutes), independent of sensor
 * noise. Mirrors the tiering used by the sensor layer's observed estimate,
 * minus the random jitter, since this represents the *true* trajectory.
 */
function estimateGroundTruthTimeToFailure(stressRatio: number): number {
  if (stressRatio >= 1.0) return 0;
  if (stressRatio >= 0.90) return Math.max(3, Math.round(6 + (1.0 - stressRatio) * 15));
  if (stressRatio >= 0.70) return Math.max(8, Math.round(15 + (0.9 - stressRatio) * 30));
  if (stressRatio >= 0.50) return Math.max(25, Math.round(45 + (0.7 - stressRatio) * 60));
  return 999;
}

/**
 * Builds the internal ground-truth SimEnvironment from a Scenario's
 * predefined inputs (nodes, edges, trueEnvironment). This is the hidden
 * "real world" that the propagation engine mutates during a simulation —
 * decision logic upstream of this (risk scoring, candidate selection) works
 * from sensor Observations instead, never from this directly.
 */
export function buildEnvironmentFromScenario(scenario: Scenario): SimEnvironment {
  const nodes: Record<string, SimNode> = {};
  const trueEnv = scenario.trueEnvironment;

  for (const node of scenario.nodes) {
    const capacity = trueEnv.trueCapacity[node.id] ?? node.capacity;
    const currentLoad = Math.max(0, trueEnv.trueLoad[node.id] ?? node.currentLoad);
    const thresholdRatio = trueEnv.failureThreshold[node.id] ?? 1.0;
    const failureThreshold = capacity * thresholdRatio;

    nodes[node.id] = {
      id: node.id,
      name: node.name,
      type: node.type,
      capacity,
      currentLoad,
      redundancyFactor: node.redundancyFactor,
      populationWeight: node.populationWeight,
      critical: node.critical,
      failureThreshold,
      timeToFailureMinutes: estimateGroundTruthTimeToFailure(currentLoad / Math.max(1e-6, capacity)),
      failed: false,
      isolated: false,
    };
  }

  // Scenario-defined ground-truth perturbations (predefined inputs — e.g. an
  // independent stress already known to hit a neighboring node) are applied
  // once, up front, before any cascade logic runs.
  for (const perturbation of trueEnv.stochasticPerturbationSchedule ?? []) {
    const target = nodes[perturbation.target];
    if (target) {
      target.currentLoad = Math.max(0, target.currentLoad + perturbation.magnitude);
    }
  }

  const edges = scenario.edges.map((e) => ({
    source: e.source,
    target: e.target,
    loadTransferRatio: e.loadTransferRatio,
    secondaryEffectMultiplier: e.secondaryEffectMultiplier,
    active: e.active ?? true,
  }));

  return { nodes, edges, seed: scenario.seed };
}

/** Deep-clones a SimEnvironment so a simulation never mutates the caller's copy. */
export function cloneEnvironment(env: SimEnvironment): SimEnvironment {
  return structuredClone(env);
}

/**
 * Physically isolates a node: severs every active edge touching it, and
 * determines which neighbors are left completely stranded as a result (i.e.
 * their only network tie ran through the isolated node). This is genuine
 * topology surgery — a neighbor only ends up in the result if the edge
 * removal actually drops its degree to zero, so which facilities (if any)
 * get stranded emerges from the scenario's own graph, never a hardcoded list.
 *
 * Mutates `env` in place — callers must clone beforehand if they need the
 * pre-isolation state preserved.
 */
export function applyIsolation(
  env: SimEnvironment,
  nodeId: string
): { steps: PropagationStep[]; isolatedIds: string[] } {
  const steps: PropagationStep[] = [];
  const isolatedIds: string[] = [];
  const target = env.nodes[nodeId];
  if (!target || target.isolated) {
    return { steps, isolatedIds };
  }

  const activeNeighborsOf = (id: string) =>
    env.edges
      .filter((e) => e.active && (e.source === id || e.target === id))
      .map((e) => (e.source === id ? e.target : e.source));

  // Snapshot neighbors BEFORE severing anything, so we know who to re-check.
  const candidateDependents = new Set(activeNeighborsOf(nodeId));

  for (const edge of env.edges) {
    if (edge.source === nodeId || edge.target === nodeId) edge.active = false;
  }

  const isolateOneNode = (id: string, cause: FailureCause) => {
    const node = env.nodes[id];
    if (!node || node.isolated) return;
    const stressBefore = computeStressPercent(node);
    const loadBefore = node.currentLoad;
    node.isolated = true;
    node.failed = true;
    node.currentLoad = 0;
    isolatedIds.push(id);
    steps.push({
      step: steps.length,
      nodeId: id,
      nodeName: node.name,
      eventType: 'isolation',
      cause,
      loadBefore: round1(loadBefore),
      loadAfter: 0,
      stressBefore: round1(stressBefore),
      stressAfter: 0,
      description:
        cause === 'service_loss'
          ? `${node.name} lost service: its only network tie ran through the isolated node.`
          : `${node.name} was physically isolated from the network to halt overload propagation.`,
    });
  };

  isolateOneNode(nodeId, 'initial_event');

  // Anyone whose only remaining path to the rest of the network ran through
  // the isolated node now has zero active edges — they're stranded.
  for (const dependentId of candidateDependents) {
    if (activeNeighborsOf(dependentId).length === 0) {
      isolateOneNode(dependentId, 'service_loss');
    }
  }

  return { steps, isolatedIds };
}

/**
 * Runs the real cascade simulation from `initialNodeId`.
 *
 * Algorithm:
 *  1. If forceInitialFailure is true and the node isn't already over its
 *     threshold, nudge it just past the threshold — this represents the
 *     scenario's sensor event confirming the node's overload trend has
 *     culminated in failure. When false (used after an intervention has
 *     already modified the node's load), the node only fails if it is
 *     genuinely still over threshold.
 *  2. On failure, the node's entire current load must find somewhere else to
 *     go (it is offline / tripped, currentLoad -> 0), and is distributed to
 *     downstream nodes over active outgoing edges, scaled by that edge's
 *     loadTransferRatio and secondaryEffectMultiplier.
 *  3. Any node whose load crosses ITS OWN failure threshold as a result also
 *     fails and propagates further, recursively, up to a hard safety cap.
 *  4. Failure never happens "because a node is reachable" — only because a
 *     calculated load value crossed a calculated threshold.
 */
export function simulateCascade(
  environment: SimEnvironment,
  initialNodeId: string,
  options: { forceInitialFailure?: boolean; maxSteps?: number } = {}
): PropagationResult {
  const { forceInitialFailure = true, maxSteps = MAX_PROPAGATION_STEPS } = options;
  const env = cloneEnvironment(environment);

  const steps: PropagationStep[] = [];
  const failedNodes: string[] = [];
  const failureCauses: Record<string, FailureCause> = {};
  let maximumStress = 0;
  let cascadeDepth = 0;
  let totalUnmetLoad = 0;

  const failNode = (nodeId: string, cause: FailureCause, depth: number) => {
    if (steps.length >= maxSteps) return;
    const node = env.nodes[nodeId];
    if (!node || node.failed) return;

    const stressBefore = computeStressPercent(node);
    maximumStress = Math.max(maximumStress, stressBefore);
    const transferable = Math.max(0, node.currentLoad);

    node.failed = true;
    node.currentLoad = 0;
    failedNodes.push(nodeId);
    failureCauses[nodeId] = cause;
    cascadeDepth = Math.max(cascadeDepth, depth);

    steps.push({
      step: steps.length,
      nodeId,
      nodeName: node.name,
      eventType: cause === 'initial_event' ? 'initial_failure' : 'overload_failure',
      cause,
      loadBefore: round1(transferable),
      loadAfter: 0,
      stressBefore: round1(stressBefore),
      stressAfter: 0,
      description: `${node.name} failed at ${round1(stressBefore)}% stress (${cause.replace('_', ' ')}); ${round1(transferable)} units of load must find another path.`,
    });

    if (transferable <= 0 || steps.length >= maxSteps) {
      totalUnmetLoad += Math.max(0, transferable);
      return;
    }

    const outgoing = env.edges.filter((e) => e.active && e.source === nodeId);
    let distributed = 0;

    for (const edge of outgoing) {
      if (steps.length >= maxSteps) break;
      const target = env.nodes[edge.target];
      if (!target || target.isolated) continue;

      const received = transferable * edge.loadTransferRatio * edge.secondaryEffectMultiplier;
      if (received <= 0) continue;
      distributed += received;

      const loadBefore = target.currentLoad;
      const stressBeforeT = computeStressPercent(target);
      target.currentLoad = Math.max(0, target.currentLoad + received);
      const stressAfterT = computeStressPercent(target);
      maximumStress = Math.max(maximumStress, stressAfterT);

      steps.push({
        step: steps.length,
        nodeId: target.id,
        nodeName: target.name,
        eventType: 'load_transfer',
        loadBefore: round1(loadBefore),
        loadAfter: round1(target.currentLoad),
        stressBefore: round1(stressBeforeT),
        stressAfter: round1(stressAfterT),
        description: `${node.name} spilled ${round1(received)} units onto ${target.name} (stress ${round1(stressBeforeT)}% -> ${round1(stressAfterT)}%).`,
      });

      if (!target.failed && target.currentLoad > target.failureThreshold) {
        failNode(target.id, 'overload_cascade', depth + 1);
      }
    }

    // Load that had nowhere to go (edges don't have to sum to 100% of the
    // failed node's capacity) is tracked as unmet demand, not silently dropped.
    totalUnmetLoad += Math.max(0, transferable - distributed);
  };

  const initialNode = env.nodes[initialNodeId];
  if (initialNode && !initialNode.isolated && !initialNode.failed) {
    if (forceInitialFailure && initialNode.currentLoad < initialNode.failureThreshold) {
      // The scenario's sensor event confirms this node's overload trend has
      // now culminated in failure — nudge it just past its own threshold.
      const epsilon = Math.max(0.01, initialNode.failureThreshold * 0.001);
      initialNode.currentLoad = initialNode.failureThreshold + epsilon;
    }
    if (initialNode.currentLoad > initialNode.failureThreshold) {
      failNode(initialNodeId, 'initial_event', 0);
    } else {
      maximumStress = Math.max(maximumStress, computeStressPercent(initialNode));
    }
  }

  return finalizePropagationResult(env, failedNodes, failureCauses, steps, maximumStress, cascadeDepth, totalUnmetLoad);
}

function finalizePropagationResult(
  env: SimEnvironment,
  failedNodes: string[],
  failureCauses: Record<string, FailureCause>,
  steps: PropagationStep[],
  maximumStressSoFar: number,
  cascadeDepth: number,
  totalUnmetLoad: number
): PropagationResult {
  const finalNodeStates: PropagationResult['finalNodeStates'] = {};
  let maximumStress = maximumStressSoFar;

  for (const node of Object.values(env.nodes)) {
    const stress = computeStressPercent(node);
    finalNodeStates[node.id] = {
      load: round1(node.currentLoad),
      stress: round1(stress),
      failed: node.failed,
      isolated: node.isolated,
    };
    maximumStress = Math.max(maximumStress, stress);
  }

  const uniqueFailed = Array.from(new Set(failedNodes));
  let affectedPopulation = 0;
  let affectedCriticalFacilities = 0;
  for (const id of uniqueFailed) {
    const node = env.nodes[id];
    if (!node) continue;
    affectedPopulation += node.populationWeight;
    if (node.critical) affectedCriticalFacilities++;
  }

  const cascadeContained = !uniqueFailed.some((id) => failureCauses[id] === 'overload_cascade');

  return {
    failedNodes: uniqueFailed,
    failureCauses,
    propagationSteps: steps,
    finalNodeStates,
    affectedNodeCount: uniqueFailed.length,
    affectedPopulation,
    affectedCriticalFacilities,
    cascadeContained,
    maximumStress: round1(maximumStress),
    cascadeDepth,
    totalUnmetLoad: round1(totalUnmetLoad),
  };
}

/** The "do nothing" baseline: what happens if the scenario's initiating
 * event is left completely unmitigated. */
export function computeBaselineCascade(scenario: Scenario): PropagationResult {
  const env = buildEnvironmentFromScenario(scenario);
  return simulateCascade(env, scenario.initialEvent.nodeId, { forceInitialFailure: true });
}
