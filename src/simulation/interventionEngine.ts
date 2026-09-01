/**
 * interventionEngine.ts
 * ---------------------------------------------------------------------------
 * Simulates all three candidate interventions (Reroute Load, Isolate Node,
 * Dispatch Crew) by actually mutating a cloned copy of the ground-truth
 * environment and running it through the real propagation engine. Nothing
 * here returns a precomputed outcome — every field on the returned
 * SimulationResult is derived from that run.
 */

import {
  Observation,
  Scenario,
  SimulationResult,
  CandidateAction,
  SimEnvironment,
  PropagationResult,
  DisruptionBreakdown,
} from '../types/domain';
import { buildEnvironmentFromScenario, cloneEnvironment, simulateCascade, applyIsolation, round1 } from './propagationEngine';
import { calculateDisruptionScore } from './disruptionCalculator';
import {
  REROUTE_SAFE_STRESS_RATIO,
  HOURS_TO_RESTORE_FAILED_NODE,
  HOURS_TO_RESTORE_ISOLATED_NODE,
  CREW_ETA_MINUTES_DEFAULT,
} from './modelConstants';

export class InterventionEngine {
  /**
   * Generates candidate actions for the active scenario event. Target paths
   * for reroute are read directly off the scenario's own topology (the
   * event node's outgoing edges) rather than a hardcoded node list, so this
   * works for any scenario, not just the urban grid demo.
   */
  static getCandidateActions(scenario: Scenario): CandidateAction[] {
    const targetNode = scenario.nodes.find((n) => n.id === scenario.initialEvent.nodeId) ?? scenario.nodes[0];
    const outgoingTargets = scenario.edges.filter((e) => e.source === targetNode.id).map((e) => e.target);

    return [
      {
        id: 'act-reroute',
        type: 'reroute',
        title: 'Reroute Load',
        description: 'Redistribute load across alternate paths using available spare capacity.',
        targetNodeId: targetNode.id,
        targetNodeName: targetNode.name,
        parameters: {
          targetPaths: outgoingTargets,
        },
      },
      {
        id: 'act-isolate',
        type: 'isolate',
        title: 'Isolate Node',
        description: `Isolate ${targetNode.name} to prevent cascade spread.`,
        targetNodeId: targetNode.id,
        targetNodeName: targetNode.name,
        parameters: {
          isolatedNodeIds: [targetNode.id],
        },
      },
      {
        id: 'act-crew',
        type: 'crew',
        title: 'Dispatch Crew',
        description: `Dispatch maintenance crew to address ${targetNode.name} overload.`,
        targetNodeId: targetNode.id,
        targetNodeName: targetNode.name,
        parameters: {
          crewEtaMinutes: CREW_ETA_MINUTES_DEFAULT,
        },
      },
    ];
  }

  /** Simulates all candidate interventions deterministically. */
  static simulateAll(scenario: Scenario, observation: Observation): SimulationResult[] {
    return this.getCandidateActions(scenario).map((action) => this.simulateAction(action, scenario, observation));
  }

  /** Simulates a specific candidate action against the observation topology. */
  static simulateAction(action: CandidateAction, scenario: Scenario, observation: Observation): SimulationResult {
    return this.simulateActionWithEnvironment(action, scenario, observation).result;
  }

  /**
   * Same as simulateAction, but also returns the resulting sandbox
   * SimEnvironment so callers (verificationEngine.ts) can run a second,
   * independent shock against the *exact* post-fix state rather than
   * recomputing an approximation of it.
   *
   * `observation` is optional here: it is only used to sanity-check that the
   * action's target node id is one the sensor layer actually reported. When
   * omitted (e.g. a caller that only has ground-truth scenario data on hand)
   * the action's own targetNodeId is trusted directly — it always originates
   * from a real scenario node via getCandidateActions().
   */
  static simulateActionWithEnvironment(
    action: CandidateAction,
    scenario: Scenario,
    observation?: Observation
  ): { result: SimulationResult; environment: SimEnvironment } {
    const baseEnv = buildEnvironmentFromScenario(scenario);
    const targetId =
      !observation || observation.nodes[action.targetNodeId] ? action.targetNodeId : Object.keys(observation.nodes)[0];

    if (action.type === 'reroute') return this.simulateReroute(action, baseEnv, targetId);
    if (action.type === 'isolate') return this.simulateIsolate(action, baseEnv, targetId);
    return this.simulateCrew(action, baseEnv, observation, targetId);
  }

  /**
   * Reroute Load: sheds the target node's excess load (down to a safe
   * margin below its failure threshold) onto its actual downstream
   * neighbors, capped by each neighbor's real spare capacity
   * (capacity - currentLoad). Whatever can't be absorbed stays on the
   * target and is left for the propagation engine to resolve normally.
   */
  private static simulateReroute(
    action: CandidateAction,
    baseEnv: SimEnvironment,
    targetId: string
  ): { result: SimulationResult; environment: SimEnvironment } {
    const env = cloneEnvironment(baseEnv);
    const target = env.nodes[targetId];

    const safeLoad = target.failureThreshold * REROUTE_SAFE_STRESS_RATIO;
    const excessToShed = Math.max(0, target.currentLoad - safeLoad);

    const outgoing = env.edges.filter((e) => e.active && e.source === targetId);
    const totalRatio = outgoing.reduce((sum, e) => sum + e.loadTransferRatio, 0) || 1;

    let shed = 0;
    for (const edge of outgoing) {
      const neighbor = env.nodes[edge.target];
      if (!neighbor) continue;
      const requestedShare = excessToShed * (edge.loadTransferRatio / totalRatio);
      const spareCapacity = Math.max(0, neighbor.capacity - neighbor.currentLoad);
      const actualTransfer = Math.min(requestedShare, spareCapacity);
      neighbor.currentLoad += actualTransfer;
      target.currentLoad = Math.max(0, target.currentLoad - actualTransfer);
      shed += actualTransfer;
    }

    const overflowProduced = Math.max(0, excessToShed - shed);

    // Load has already been physically moved above; let the propagation
    // engine determine whether that was enough — no forced failure.
    const propagation = simulateCascade(env, targetId, { forceInitialFailure: false });

    const downtimeHours = round1(propagation.failedNodes.length * HOURS_TO_RESTORE_FAILED_NODE);
    const disruption = calculateDisruptionScore(
      propagation.affectedPopulation,
      downtimeHours,
      propagation.affectedCriticalFacilities
    );

    const neighborNames = outgoing.map((e) => env.nodes[e.target]?.name).filter(Boolean).join(', ');

    return {
      result: this.toSimulationResult(
        action,
        propagation,
        env,
        {
          downtimeHours,
          spareCapacityUsed: round1(shed),
          overflowProduced: round1(overflowProduced),
          rationale: propagation.cascadeContained
            ? `Redistributed ${round1(shed)} units of excess load to ${neighborNames || 'downstream nodes'} within available spare capacity; no other node crossed its failure threshold.`
            : `Only ${round1(shed)} of ${round1(excessToShed)} excess units could be absorbed by downstream spare capacity; the cascade still propagated to ${propagation.failedNodes.length} node(s).`,
        },
        disruption
      ),
      environment: env,
    };
  }

  /**
   * Isolate Node: actually severs the target's edges (real topology
   * mutation) and lets the graph itself determine which, if any, downstream
   * facilities are left with no alternate feed and are therefore stranded.
   */
  private static simulateIsolate(
    action: CandidateAction,
    baseEnv: SimEnvironment,
    targetId: string
  ): { result: SimulationResult; environment: SimEnvironment } {
    const env = cloneEnvironment(baseEnv);
    const { steps: isolationSteps, isolatedIds } = applyIsolation(env, targetId);

    // With the target's edges severed, check whether anything else in the
    // network was independently at risk (there normally won't be, since the
    // isolation removed the only overload source — but this keeps the model
    // honest instead of assuming it).
    const propagation = simulateCascade(env, targetId, { forceInitialFailure: false });

    const allFailedIds = Array.from(new Set([...isolatedIds, ...propagation.failedNodes]));
    let affectedPopulation = 0;
    let affectedCriticalFacilities = 0;
    for (const id of allFailedIds) {
      const node = env.nodes[id];
      if (!node) continue;
      affectedPopulation += node.populationWeight;
      if (node.critical) affectedCriticalFacilities++;
    }

    // Load the isolated/stranded nodes were carrying at the moment of the
    // cut, now unserved.
    let unservedLoad = propagation.totalUnmetLoad;
    for (const id of isolatedIds) {
      unservedLoad += baseEnv.nodes[id]?.currentLoad ?? 0;
    }

    const combined: PropagationResult = {
      failedNodes: allFailedIds,
      failureCauses: {
        ...propagation.failureCauses,
        ...Object.fromEntries(isolatedIds.map((id) => [id, id === targetId ? 'initial_event' : 'service_loss'] as const)),
      },
      propagationSteps: [...isolationSteps, ...propagation.propagationSteps],
      finalNodeStates: propagation.finalNodeStates,
      affectedNodeCount: allFailedIds.length,
      affectedPopulation,
      affectedCriticalFacilities,
      cascadeContained: propagation.cascadeContained,
      maximumStress: propagation.maximumStress,
      cascadeDepth: propagation.cascadeDepth,
      totalUnmetLoad: round1(unservedLoad),
    };

    const strandedNames = isolatedIds
      .filter((id) => id !== targetId)
      .map((id) => env.nodes[id]?.name)
      .filter(Boolean);

    const downtimeHours = round1(
      isolatedIds.length * HOURS_TO_RESTORE_ISOLATED_NODE +
        (allFailedIds.length - isolatedIds.length) * HOURS_TO_RESTORE_FAILED_NODE
    );
    const disruption = calculateDisruptionScore(affectedPopulation, downtimeHours, affectedCriticalFacilities);

    return {
      result: this.toSimulationResult(
        action,
        combined,
        env,
        {
          downtimeHours,
          spareCapacityUsed: 0,
          overflowProduced: round1(unservedLoad),
          rationale:
            strandedNames.length > 0
              ? `Physically isolating ${env.nodes[targetId]?.name} halts overload propagation but strands ${strandedNames.join(', ')}, which had no alternate feed.`
              : `Physically isolating ${env.nodes[targetId]?.name} halts overload propagation with no other node losing its only feed.`,
        },
        disruption
      ),
      environment: env,
    };
  }

  /**
   * Dispatch Crew: compares the OBSERVED (sensor-reported) time-to-failure
   * against the crew's ETA. If the crew arrives first, on-site mitigation
   * resolves the overload before it can propagate (no forced failure). If
   * not, the node fails exactly as it would with no intervention at all.
   */
  private static simulateCrew(
    action: CandidateAction,
    baseEnv: SimEnvironment,
    observation: Observation | undefined,
    targetId: string
  ): { result: SimulationResult; environment: SimEnvironment } {
    const env = cloneEnvironment(baseEnv);
    const observedTTF = observation?.nodes[targetId]?.timeToFailureMinutes ?? env.nodes[targetId]?.timeToFailureMinutes ?? 0;
    const crewEta = action.parameters.crewEtaMinutes ?? CREW_ETA_MINUTES_DEFAULT;
    const arrivesInTime = crewEta < observedTTF;

    const propagation = simulateCascade(env, targetId, { forceInitialFailure: !arrivesInTime });

    const downtimeHours = arrivesInTime
      ? round1(crewEta / 60) // brief on-site repair window, no outage occurs
      : round1(propagation.failedNodes.length * HOURS_TO_RESTORE_FAILED_NODE);

    const disruption = calculateDisruptionScore(
      propagation.affectedPopulation,
      downtimeHours,
      propagation.affectedCriticalFacilities
    );

    return {
      result: this.toSimulationResult(
        action,
        propagation,
        env,
        {
          downtimeHours,
          spareCapacityUsed: 0,
          overflowProduced: round1(propagation.totalUnmetLoad),
          crewEtaMinutes: crewEta,
          rationale: arrivesInTime
            ? `Crew ETA (${crewEta} min) is before the projected time-to-failure (${observedTTF} min); on-site mitigation resolves the overload before it can cascade.`
            : `Crew ETA (${crewEta} min) exceeds the projected time-to-failure (${observedTTF} min); the node fails before the crew arrives and the cascade proceeds unmitigated.`,
        },
        disruption
      ),
      environment: env,
    };
  }

  /** Converts a raw PropagationResult into the domain's SimulationResult shape. */
  private static toSimulationResult(
    action: CandidateAction,
    propagation: PropagationResult,
    env: SimEnvironment,
    details: {
      downtimeHours: number;
      spareCapacityUsed: number;
      overflowProduced: number;
      crewEtaMinutes?: number;
      rationale: string;
    },
    disruption: DisruptionBreakdown
  ): SimulationResult {
    const totalNodes = Object.keys(env.nodes).length;
    const isEffective = propagation.cascadeContained;
    const containmentRate =
      totalNodes > 0 ? Math.round(((totalNodes - propagation.affectedNodeCount) / totalNodes) * 100) : 0;

    const nodesStressAfter: Record<string, number> = {};
    for (const [id, state] of Object.entries(propagation.finalNodeStates)) {
      nodesStressAfter[id] = Math.round(state.stress);
    }

    return {
      actionId: action.id,
      actionType: action.type,
      title: action.title,
      description: action.description,
      isEffective,
      containmentRate,
      containmentLabel: isEffective ? 'YES' : 'NO',
      populationImpact: propagation.affectedPopulation,
      criticalFacilitiesImpact: propagation.affectedCriticalFacilities,
      disruptionScore: disruption.totalDisruptionScore,
      nodesStressAfter,
      affectedNodeCount: propagation.affectedNodeCount,
      propagationPath: propagation.failedNodes,
      details,
    };
  }
}
