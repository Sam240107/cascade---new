import { ImpactSummary, SimulationResult } from '../types/domain';

export class ImpactCalculator {
  static calculateImpact(
    unmitigatedCascade: { affectedNodes: number; population: number; critical: number; disruption: number },
    chosenIntervention: SimulationResult
  ): ImpactSummary {
    const unmitNodes = unmitigatedCascade.affectedNodes;
    const withNodes = chosenIntervention.affectedNodeCount;
    const diffNodes = withNodes - unmitNodes;
    const pctNodes = unmitNodes > 0 ? Math.round((diffNodes / unmitNodes) * 100) : 0;

    const unmitPop = unmitigatedCascade.population;
    const withPop = chosenIntervention.populationImpact;
    const diffPop = withPop - unmitPop;
    const pctPop = unmitPop > 0 ? Math.round((diffPop / unmitPop) * 100) : 0;

    const unmitCrit = unmitigatedCascade.critical;
    const withCrit = chosenIntervention.criticalFacilitiesImpact;
    const diffCrit = withCrit - unmitCrit;
    const pctCrit = unmitCrit > 0 ? Math.round((diffCrit / unmitCrit) * 100) : 0;

    const unmitDisruption = unmitigatedCascade.disruption;
    const withDisruption = chosenIntervention.disruptionScore;
    const diffDisruption = withDisruption - unmitDisruption;
    const pctDisruption = unmitDisruption > 0 ? Math.round((diffDisruption / unmitDisruption) * 100) : 0;

    return {
      metrics: [
        {
          id: 'nodes_affected',
          name: 'Nodes Affected',
          withoutCascade: unmitNodes,
          withCascade: withNodes,
          difference: diffNodes,
          percentageDelta: `${pctNodes}%`,
        },
        {
          id: 'population_exposed',
          name: 'Population Exposed',
          withoutCascade: unmitPop,
          withCascade: withPop,
          difference: diffPop,
          percentageDelta: `${pctPop}%`,
        },
        {
          id: 'critical_facilities',
          name: 'Critical Facilities',
          withoutCascade: unmitCrit,
          withCascade: withCrit,
          difference: diffCrit,
          percentageDelta: `${pctCrit}%`,
        },
        {
          id: 'total_disruption_score',
          name: 'Total Disruption Score',
          withoutCascade: unmitDisruption,
          withCascade: withDisruption,
          difference: diffDisruption,
          percentageDelta: `${pctDisruption}%`,
        },
      ],
    };
  }
}
