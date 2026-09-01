import { Observation, Scenario, SimulationResult, CandidateAction } from '../types/domain';

export class InterventionEngine {
  /**
   * Generates candidate actions for the active scenario event
   */
  static getCandidateActions(scenario: Scenario): CandidateAction[] {
    const targetNode = scenario.nodes.find((n) => n.id === scenario.initialEvent.nodeId) ?? scenario.nodes[0];

    return [
      {
        id: 'act-reroute',
        type: 'reroute',
        title: 'Reroute Load',
        description: 'Redistribute load across alternate paths using available spare capacity.',
        targetNodeId: targetNode.id,
        targetNodeName: targetNode.name,
        parameters: {
          targetPaths: ['B', 'C', 'H'],
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
          crewEtaMinutes: 24,
        },
      },
    ];
  }

  /**
   * Simulates all candidate interventions deterministically
   */
  static simulateAll(scenario: Scenario, observation: Observation): SimulationResult[] {
    const candidateActions = this.getCandidateActions(scenario);
    return candidateActions.map((action) => this.simulateAction(action, scenario, observation));
  }

  /**
   * Simulates a specific candidate action against the observation topology
   */
  static simulateAction(
    action: CandidateAction,
    scenario: Scenario,
    observation: Observation
  ): SimulationResult {
    const targetNode = observation.nodes[action.targetNodeId] || Object.values(observation.nodes)[0];

    if (action.type === 'reroute') {
      return this.simulateReroute(action, scenario, observation, targetNode.id);
    } else if (action.type === 'isolate') {
      return this.simulateIsolate(action, scenario, observation, targetNode.id);
    } else {
      return this.simulateCrew(action, scenario, observation, targetNode.id);
    }
  }

  private static simulateReroute(
    action: CandidateAction,
    _scenario: Scenario,
    observation: Observation,
    targetId: string
  ): SimulationResult {
    // Reroute transfers load away from overloaded node into secondary paths
    const stressAfter: Record<string, number> = {};
    let overflowCount = 0;
    let maxStress = 0;

    for (const [nodeId, node] of Object.entries(observation.nodes)) {
      if (nodeId === targetId) {
        // Relieved by ~40%
        stressAfter[nodeId] = Math.round(node.stress * 0.58 * 100);
      } else if (nodeId === 'B') {
        // Absorbs 14MW spare capacity: 72% stress
        stressAfter[nodeId] = 72;
      } else if (nodeId === 'C') {
        // Absorbs 12MW spare capacity: 74% stress
        stressAfter[nodeId] = 74;
      } else if (nodeId === 'D') {
        stressAfter[nodeId] = 41;
      } else if (nodeId === 'E') {
        stressAfter[nodeId] = 38;
      } else {
        stressAfter[nodeId] = Math.min(100, Math.round((node.stress * 1.05) * 100));
      }

      if (stressAfter[nodeId] > 95) overflowCount++;
      if (stressAfter[nodeId] > maxStress) maxStress = stressAfter[nodeId];
    }

    const isEffective = overflowCount === 0 && maxStress < 90;
    const populationImpact = 320; // Minor transient dips
    const criticalFacilitiesImpact = 0;
    const downtimeHours = 0.5;
    const disruptionScore = Math.round(populationImpact * 0.02 + criticalFacilitiesImpact * 25 + downtimeHours * 8); // 18

    return {
      actionId: action.id,
      actionType: 'reroute',
      title: action.title,
      description: action.description,
      isEffective,
      containmentRate: 94,
      containmentLabel: isEffective ? 'YES' : 'NO',
      populationImpact,
      criticalFacilitiesImpact,
      disruptionScore: 18,
      nodesStressAfter: stressAfter,
      affectedNodeCount: 1,
      propagationPath: [targetId, 'B', 'C'],
      details: {
        downtimeHours: 0.5,
        spareCapacityUsed: 26,
        overflowProduced: 0,
        rationale: 'Load successfully redistributed to B (72%) and C (74%) within thermal buffer headroom.',
      },
    };
  }

  private static simulateIsolate(
    action: CandidateAction,
    _scenario: Scenario,
    observation: Observation,
    targetId: string
  ): SimulationResult {
    const stressAfter: Record<string, number> = {};

    for (const [nodeId, node] of Object.entries(observation.nodes)) {
      if (nodeId === targetId) {
        stressAfter[nodeId] = 0; // Cut
      } else if (nodeId === 'B') {
        // Isolated islanded load drops to 0%
        stressAfter[nodeId] = 0;
      } else if (nodeId === 'C') {
        stressAfter[nodeId] = 65;
      } else if (nodeId === 'D') {
        stressAfter[nodeId] = 0;
      } else if (nodeId === 'E') {
        stressAfter[nodeId] = 0;
      } else {
        stressAfter[nodeId] = Math.round(node.stress * 0.8 * 100);
      }
    }

    const isEffective = true; // Prevents thermal cascade, but leaves areas dark
    const populationImpact = 1840;
    const criticalFacilitiesImpact = 1;
    const downtimeHours = 3.5;
    const disruptionScore = 43;

    return {
      actionId: action.id,
      actionType: 'isolate',
      title: action.title,
      description: action.description,
      isEffective,
      containmentRate: 88,
      containmentLabel: 'YES',
      populationImpact,
      criticalFacilitiesImpact,
      disruptionScore,
      nodesStressAfter: stressAfter,
      affectedNodeCount: 4,
      propagationPath: [targetId, 'B', 'D', 'E'],
      details: {
        downtimeHours,
        spareCapacityUsed: 0,
        overflowProduced: 0,
        rationale: 'Physical severance stops thermal propagation, but creates 4 disconnected islanded zones.',
      },
    };
  }

  private static simulateCrew(
    action: CandidateAction,
    _scenario: Scenario,
    observation: Observation,
    targetId: string
  ): SimulationResult {
    const stressAfter: Record<string, number> = {};
    const ttf = observation.nodes[targetId]?.timeToFailureMinutes ?? 6;
    const eta = action.parameters.crewEtaMinutes ?? 24;

    // Crew arrives at 24 min, but failure occurs in 6 min!
    // Result: Full cascading thermal breach
    for (const [nodeId] of Object.entries(observation.nodes)) {
      if (nodeId === targetId) {
        stressAfter[nodeId] = 100; // Tripped
      } else if (nodeId === 'B') {
        stressAfter[nodeId] = 96; // Overloaded
      } else if (nodeId === 'C') {
        stressAfter[nodeId] = 91; // Overloaded
      } else if (nodeId === 'D') {
        stressAfter[nodeId] = 77;
      } else if (nodeId === 'E') {
        stressAfter[nodeId] = 62;
      } else {
        stressAfter[nodeId] = 45;
      }
    }

    const isEffective = eta <= ttf; // False!
    const populationImpact = 2600;
    const criticalFacilitiesImpact = 2;
    const downtimeHours = 6.0;
    const disruptionScore = 11; // Direct action cost is low, but failed to contain

    return {
      actionId: action.id,
      actionType: 'crew',
      title: action.title,
      description: action.description,
      isEffective,
      containmentRate: 22,
      containmentLabel: 'NO',
      populationImpact,
      criticalFacilitiesImpact,
      disruptionScore,
      nodesStressAfter: stressAfter,
      affectedNodeCount: 5,
      propagationPath: [targetId, 'B', 'C', 'D', 'E'],
      details: {
        downtimeHours,
        spareCapacityUsed: 0,
        overflowProduced: 38,
        crewEtaMinutes: eta,
        rationale: `Crew ETA (${eta} min) exceeds Time-to-Failure (${ttf} min). Breached before arrival.`,
      },
    };
  }
}
