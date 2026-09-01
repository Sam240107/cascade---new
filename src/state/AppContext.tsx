import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Scenario,
  Observation,
  RiskScore,
  SensorEvent,
  SimulationResult,
  Recommendation,
  VerificationResult,
  ImpactSummary,
  BenchmarkResult,
  EngineSettings,
  InfrastructureNode,
} from '../types/domain';
import { PREDEFINED_SCENARIOS } from '../data/scenarios';
import { SensorGenerator } from '../simulation/sensorGenerator';
import { RiskCalculator, DEFAULT_RISK_WEIGHTS } from '../simulation/riskCalculator';
import { InterventionEngine } from '../simulation/interventionEngine';
import { RecommendationEngine } from '../simulation/recommendationEngine';
import { VerificationEngine } from '../simulation/verificationEngine';
import { ImpactCalculator } from '../simulation/impactCalculator';
import { BenchmarkEngine } from '../simulation/benchmarkEngine';
import { calculateDisruptionScore } from '../simulation/disruptionCalculator';
import { HOURS_TO_RESTORE_FAILED_NODE } from '../simulation/modelConstants';
import { CaseStudy } from '../caseStudies/types';
import { getCaseStudies, getCaseStudy } from '../caseStudies/registry';
import { runCaseStudy, runCaseStudyDomainActions, CaseStudyRunResult, DomainActionCaseResult, DomainActionResult } from '../caseStudies/caseStudyRunner';
import { buildGroundTruthObservation } from '../caseStudies/caseStudyObservationAdapter';

export type AppRoute =
  | 'overview'
  | 'events'
  | 'risk'
  | 'simulation'
  | 'recommendation'
  | 'verification'
  | 'impact'
  | 'scenarios'
  | 'benchmarks'
  | 'settings';

export type AppTheme = 'light' | 'dark';

interface AppContextType {
  // Theme Management
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;

  // Navigation
  activeRoute: AppRoute;
  setActiveRoute: (route: AppRoute) => void;

  // Scenario & Data Source
  scenarios: Scenario[];
  selectedScenario: Scenario;
  loadScenario: (scenarioId: string) => void;
  dataSourceMode: 'PREDEFINED SCENARIO' | 'REALTIME (UNCONNECTED)' | 'CASE STUDY / COUNTERFACTUAL';

  // Real-World Case Studies (Phase 3)
  caseStudies: CaseStudy[];
  selectedCaseStudyId: string | null;
  activeCaseStudy: CaseStudy | null;
  isCaseStudyMode: boolean;
  selectCaseStudy: (id: string | null) => void;
  caseStudyResult: CaseStudyRunResult | null;
  domainActionResult: DomainActionCaseResult | null;
  futureDomainActions: DomainActionResult[];
  caseStudyError: string | null;

  // Observation & Events
  observation: Observation;
  activeEvent: SensorEvent;
  refreshObservation: () => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedNode: InfrastructureNode | null;

  // Visual Graph Options
  graphViewMode: 'stress' | 'topology';
  setGraphViewMode: (mode: 'stress' | 'topology') => void;

  // Risk Scores
  riskScores: RiskScore[];

  // Interventions & Simulation
  simulations: SimulationResult[];
  recommendation: Recommendation;
  isRecommendationAvailable: boolean;
  isSandboxApplied: boolean;
  applyRecommendationToSandbox: () => void;
  resetSandbox: () => void;

  // Verification
  verificationResult: VerificationResult;
  runVerification: (runsCount?: number) => void;
  isVerifying: boolean;

  // Counterfactual Impact
  impactSummary: ImpactSummary;

  // Benchmarks
  benchmarkResult: BenchmarkResult;
  runBenchmark: () => void;
  isBenchmarking: boolean;

  // Settings
  settings: EngineSettings;
  updateSettings: (newSettings: Partial<EngineSettings>) => void;

  // Modals & UI
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isWhyActionModalOpen: boolean;
  setIsWhyActionModalOpen: (open: boolean) => void;
  isAddWidgetModalOpen: boolean;
  setIsAddWidgetModalOpen: (open: boolean) => void;
  isNetworkExpanded: boolean;
  setIsNetworkExpanded: (expanded: boolean) => void;

  // Auto Refresh & Live Clock
  autoRefresh: boolean;
  setAutoRefresh: (auto: boolean) => void;
  simulationTime: string;
  lastUpdated: string;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state: defaults to 'light', transforms to Black/White/Red when 'dark'
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('cascade_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('cascade_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  // Sync html class with initial theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [activeRoute, setActiveRoute] = useState<AppRoute>('overview');
  const [scenarios] = useState<Scenario[]>(PREDEFINED_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('urban-grid-0421');

  // Real-World Case Studies (Phase 3): selecting one switches the whole
  // dashboard into counterfactual mode, sourced entirely from
  // src/caseStudies/registry.ts + caseStudyRunner.ts + domainActions.ts —
  // never from SensorGenerator and never independently computed here.
  const [caseStudies] = useState<CaseStudy[]>(() => getCaseStudies());
  const [selectedCaseStudyId, setSelectedCaseStudyId] = useState<string | null>(null);
  const isCaseStudyMode = selectedCaseStudyId !== null;

  const dataSourceMode = isCaseStudyMode ? 'CASE STUDY / COUNTERFACTUAL' : 'PREDEFINED SCENARIO';

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('A');
  const [graphViewMode, setGraphViewMode] = useState<'stress' | 'topology'>('stress');

  const [isSandboxApplied, setIsSandboxApplied] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isWhyActionModalOpen, setIsWhyActionModalOpen] = useState<boolean>(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState<boolean>(false);
  const [isNetworkExpanded, setIsNetworkExpanded] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  const [simulationTime, setSimulationTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
  });
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
  });

  const [settings, setSettings] = useState<EngineSettings>({
    weights: DEFAULT_RISK_WEIGHTS,
    stressThresholds: {
      critical: 0.90,
      high: 0.70,
      moderate: 0.50,
      low: 0.30,
    },
    criticalFacilityPenalty: 25,
    populationDowntimeWeight: 0.02,
    sensorConfig: {
      dropoutRate: 0.05,
      noiseSigma: 0.8,
      maxStalenessTicks: 4,
      sensorSeed: 8812,
    },
    verificationRuns: 10,
    benchmarkMode: 'development',
    autoRefreshIntervalSec: 5,
  });

  // Active real-world case (null in normal scenario mode)
  const activeCaseStudy = useMemo(() => {
    return selectedCaseStudyId ? getCaseStudy(selectedCaseStudyId) ?? null : null;
  }, [selectedCaseStudyId]);

  // Runs the case through the EXISTING, unmodified engine (Phase 1's
  // runCaseStudy) and the EXISTING domain-action layer (Phase 2's
  // runCaseStudyDomainActions). Guarded with try/catch and computed as one
  // pure, side-effect-free value — a case-study computation failure must
  // surface as a visible error state, never a fake fallback result and
  // never a crashed dashboard, and never a setState call during render.
  const [verificationTestCount, setVerificationTestCount] = useState<number>(10);

  const caseStudyComputation = useMemo<{
    caseStudyResult: CaseStudyRunResult | null;
    domainActionResult: DomainActionCaseResult | null;
    error: string | null;
  }>(() => {
    if (!activeCaseStudy) return { caseStudyResult: null, domainActionResult: null, error: null };
    try {
      return {
        caseStudyResult: runCaseStudy(activeCaseStudy),
        domainActionResult: runCaseStudyDomainActions(activeCaseStudy, verificationTestCount),
        error: null,
      };
    } catch (err) {
      return {
        caseStudyResult: null,
        domainActionResult: null,
        error: err instanceof Error ? err.message : 'Unknown case-study simulation error.',
      };
    }
  }, [activeCaseStudy, verificationTestCount]);

  const { caseStudyResult, domainActionResult, error: caseStudyError } = caseStudyComputation;

  const futureDomainActions = useMemo<DomainActionResult[]>(() => {
    return domainActionResult?.futureActions ?? [];
  }, [domainActionResult]);

  // Active scenario — the selected case's own modelled network when a case
  // study is active (it IS a plain Scenario, see caseStudies/types.ts), the
  // predefined scenario otherwise. Every existing page/card reads this via
  // useApp() unchanged.
  const selectedScenario = useMemo(() => {
    if (activeCaseStudy) return activeCaseStudy.network;
    return scenarios.find((s) => s.id === selectedScenarioId) ?? scenarios[0];
  }, [activeCaseStudy, scenarios, selectedScenarioId]);

  // Generate observation. In case-study mode this is built SYNCHRONOUSLY
  // (plain useMemo, directly from the case's own ground truth via
  // buildGroundTruthObservation — SensorGenerator is never called for the
  // case-study path) so it can never lag one render behind `selectedScenario`
  // switching to a differently-shaped network. Scenario mode keeps the
  // original useState+useEffect pattern (needed so refreshObservation() can
  // manually re-randomize SensorGenerator's noise/dropout on demand).
  const groundTruthObservation = useMemo(() => {
    return isCaseStudyMode ? buildGroundTruthObservation(selectedScenario) : null;
  }, [isCaseStudyMode, selectedScenario]);

  const [sensorObservation, setSensorObservation] = useState<Observation>(() => {
    return SensorGenerator.generateObservation(selectedScenario, settings.sensorConfig);
  });

  // Update the SensorGenerator-backed observation on scenario or sensor
  // setting change — skipped entirely while in case-study mode, since
  // groundTruthObservation above already covers that case synchronously.
  useEffect(() => {
    if (isCaseStudyMode) return;
    const obs = SensorGenerator.generateObservation(selectedScenario, settings.sensorConfig);
    setSensorObservation(obs);
    setIsSandboxApplied(false);
    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
  }, [selectedScenario, settings.sensorConfig, isCaseStudyMode]);

  const observation = groundTruthObservation ?? sensorObservation;

  const refreshObservation = useCallback(() => {
    if (isCaseStudyMode) {
      // groundTruthObservation is already synchronous/current; just bump the clock.
      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLastUpdated(now);
      setSimulationTime(now);
      return;
    }
    const obs = SensorGenerator.generateObservation(selectedScenario, settings.sensorConfig);
    setSensorObservation(obs);
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLastUpdated(now);
    setSimulationTime(now);
  }, [selectedScenario, settings.sensorConfig, isCaseStudyMode]);

  // Active initial event
  const activeEvent = selectedScenario.initialEvent;

  // Selected node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return selectedScenario.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedScenario, selectedNodeId]);

  // Compute Risk Scores — same existing RiskCalculator call either way;
  // `observation`/`selectedScenario` above already carry case-study ground
  // truth when active, so this needs no branching of its own.
  const riskScores = useMemo(() => {
    return RiskCalculator.calculateRiskScores(observation, selectedScenario, settings.weights);
  }, [observation, selectedScenario, settings.weights]);

  // Simulate Candidate Interventions. In case-study mode these are the
  // domain's SUPPORTED_BY_CURRENT_ENGINE actions (already real,
  // engine-computed SimulationResults from runCaseStudyDomainActions) with
  // their `.title` relabeled to the domain-specific action name for
  // display — every other field is untouched, DERIVED engine output.
  // Nothing here calculates a result; it only picks which already-computed
  // results to show and what to call them.
  const scenarioSimulations = useMemo(() => {
    return InterventionEngine.simulateAll(selectedScenario, observation);
  }, [selectedScenario, observation]);

  const simulations = useMemo(() => {
    if (!isCaseStudyMode) return scenarioSimulations;
    return (domainActionResult?.supportedActions ?? []).map((r) => ({
      ...r.simulation!,
      title: r.action.name,
    }));
  }, [isCaseStudyMode, scenarioSimulations, domainActionResult]);

  const NO_RECOMMENDATION_SENTINEL = useMemo(
    () => ({
      actionId: 'none',
      actionType: 'reroute' as const,
      title: 'No Simulated Action Available',
      reason: 'No domain action declared for this case is SUPPORTED_BY_CURRENT_ENGINE.',
      disruptionScore: 0,
      containmentPercentage: 0,
      populationImpact: 0,
      criticalFacilityImpact: 0,
      confidencePercentage: 0,
      effectiveAlternatives: [],
      rejectedAlternatives: [],
      explanationSummary:
        'CASCADE did not recommend an action because none of this case\'s declared domain actions are ' +
        'currently backed by the simplified engine — see the Future Domain-Solver Actions below.',
      auditTrail: {
        scenarioId: selectedScenario.id,
        evaluatedAt: new Date().toLocaleTimeString(),
        evaluatedActionsCount: 0,
        decisionRule: 'NO_SIMULATED_ACTION_AVAILABLE',
      },
    }),
    [selectedScenario.id]
  );

  const scenarioRecommendation = useMemo(() => {
    return RecommendationEngine.evaluate(scenarioSimulations, selectedScenario);
  }, [scenarioSimulations, selectedScenario]);

  const recommendation = useMemo(() => {
    if (!isCaseStudyMode) return scenarioRecommendation;
    const rec = domainActionResult?.recommendation;
    if (rec && rec.status === 'RECOMMENDED') {
      // The underlying RecommendationEngine text (reason/explanationSummary)
      // is real, DERIVED output — left untouched except for one honest,
      // mechanical substitution: every supported action's generic engine
      // label (e.g. "Reroute Load") is swapped for its domain-specific name
      // (e.g. "Transfer Critical Load") wherever it appears, so the prose
      // matches the title above it instead of naming a different mechanism.
      let reason = rec.recommendation.reason;
      let explanationSummary = rec.recommendation.explanationSummary;
      for (const r of domainActionResult?.supportedActions ?? []) {
        const generic = r.simulation!.title;
        const domainName = r.action.name;
        if (!generic || generic === domainName) continue;
        reason = reason.split(generic).join(domainName).split(generic.toUpperCase()).join(domainName.toUpperCase());
        explanationSummary = explanationSummary
          .split(generic)
          .join(domainName)
          .split(generic.toUpperCase())
          .join(domainName.toUpperCase());
      }
      return { ...rec.recommendation, title: rec.chosenAction.name, reason, explanationSummary };
    }
    return NO_RECOMMENDATION_SENTINEL;
  }, [isCaseStudyMode, scenarioRecommendation, domainActionResult, NO_RECOMMENDATION_SENTINEL]);

  const isRecommendationAvailable = !isCaseStudyMode || domainActionResult?.recommendation.status === 'RECOMMENDED';

  const PENDING_VERIFICATION_SENTINEL = useMemo<VerificationResult>(
    () => ({
      status: 'PENDING',
      independentPerturbation: { eventType: 'N/A', targetNodeId: 'N/A', targetNodeName: 'N/A', magnitude: 0, seed: 0 },
      postFixContainment: 'not contained',
      reCascadeRate: '0 / 0 (0%)',
      reCascadePercentage: 0,
      testsConducted: 0,
      testsPassed: 0,
      affectedNodesCount: 0,
      populationImpact: 0,
      criticalFacilities: 0,
      details: 'No supported action was simulated for this case, so no post-fix state exists to verify.',
      timestamp: new Date().toLocaleTimeString(),
    }),
    []
  );

  // Initial Verification Result (scenario mode only — case-study mode's
  // verification is DERIVED directly from domainActionResult, see below).
  const [verificationResult, setVerificationResult] = useState<VerificationResult>(() => {
    const defaultSim = scenarioSimulations[0] ?? {
      actionId: 'act-reroute',
      actionType: 'reroute',
      title: 'Reroute Load',
      description: '',
      isEffective: true,
      containmentRate: 94,
      containmentLabel: 'YES',
      populationImpact: 320,
      criticalFacilitiesImpact: 0,
      disruptionScore: 18,
      nodesStressAfter: { A: 55, B: 72, C: 74, D: 41, E: 38 },
      affectedNodeCount: 1,
      propagationPath: ['A', 'B', 'C'],
      details: { downtimeHours: 0.5, spareCapacityUsed: 26, overflowProduced: 0, rationale: '' },
    };
    return VerificationEngine.runVerification(scenarioRecommendation, defaultSim, selectedScenario, 10);
  });

  const activeVerificationResult = useMemo(() => {
    if (!isCaseStudyMode) return verificationResult;
    const rec = domainActionResult?.recommendation;
    return rec && rec.status === 'RECOMMENDED' ? rec.verification : PENDING_VERIFICATION_SENTINEL;
  }, [isCaseStudyMode, verificationResult, domainActionResult, PENDING_VERIFICATION_SENTINEL]);

  // Re-run verification. In case-study mode this updates the test-run count
  // that `runCaseStudyDomainActions` (via domainActionResult above) already
  // re-derives verification from — never a separately invented result.
  const runVerification = useCallback(
    (runsCount = settings.verificationRuns) => {
      setIsVerifying(true);
      if (isCaseStudyMode) {
        setVerificationTestCount(runsCount);
        setIsVerifying(false);
        setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
        return;
      }
      const chosenSim =
        scenarioSimulations.find((s) => s.actionId === scenarioRecommendation.actionId) ?? scenarioSimulations[0];
      const result = VerificationEngine.runVerification(
        scenarioRecommendation,
        chosenSim,
        selectedScenario,
        runsCount
      );
      setVerificationResult(result);
      setIsVerifying(false);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
    },
    [isCaseStudyMode, scenarioRecommendation, scenarioSimulations, selectedScenario, settings.verificationRuns]
  );

  // Compute Counterfactual Impact Summary. In case-study mode the
  // "unmitigated" baseline is the REAL, engine-computed baseline
  // (computeBaselineCascade, via caseStudyResult) rather than a fixed stub —
  // still routed through the existing, unmodified ImpactCalculator.
  const impactSummary = useMemo(() => {
    if (isCaseStudyMode) {
      if (!caseStudyResult || !isRecommendationAvailable) return { metrics: [] };
      const baseline = caseStudyResult.cascadeCounterfactual.baseline;
      const downtimeHours = baseline.affectedNodeCount * HOURS_TO_RESTORE_FAILED_NODE;
      const baselineDisruption = calculateDisruptionScore(
        baseline.affectedPopulation,
        downtimeHours,
        baseline.affectedCriticalFacilities
      ).totalDisruptionScore;
      const chosenSim = simulations.find((s) => s.actionId === recommendation.actionId) ?? simulations[0];
      if (!chosenSim) return { metrics: [] };
      return ImpactCalculator.calculateImpact(
        {
          affectedNodes: baseline.affectedNodeCount,
          population: baseline.affectedPopulation,
          critical: baseline.affectedCriticalFacilities,
          disruption: baselineDisruption,
        },
        chosenSim
      );
    }
    const chosenSim =
      scenarioSimulations.find((s) => s.actionId === scenarioRecommendation.actionId) ?? scenarioSimulations[0];
    const unmitigated = {
      affectedNodes: 7,
      population: 3200,
      critical: 3,
      disruption: 98,
    };
    return ImpactCalculator.calculateImpact(unmitigated, chosenSim);
  }, [isCaseStudyMode, caseStudyResult, isRecommendationAvailable, simulations, recommendation, scenarioSimulations, scenarioRecommendation]);

  // Benchmark Engine State
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult>(() =>
    BenchmarkEngine.getInitialBenchmarkState()
  );

  const runBenchmark = useCallback(() => {
    setIsBenchmarking(true);
    setTimeout(() => {
      const result = BenchmarkEngine.runBenchmarkSuite(scenarios);
      setBenchmarkResult(result);
      setIsBenchmarking(false);
    }, 400);
  }, [scenarios]);

  // Apply to Sandbox
  const applyRecommendationToSandbox = useCallback(() => {
    setIsSandboxApplied(true);
    runVerification(settings.verificationRuns);
  }, [runVerification, settings.verificationRuns]);

  const resetSandbox = useCallback(() => {
    setIsSandboxApplied(false);
  }, []);

  const loadScenario = useCallback((id: string) => {
    setSelectedCaseStudyId(null);
    setSelectedScenarioId(id);
    setSelectedNodeId('A');
    setIsSandboxApplied(false);
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLastUpdated(now);
    setSimulationTime(now);
  }, []);

  // Select a real-world case study (or pass null to return to predefined-
  // scenario mode). Resets the selected node to the case's own initiating
  // contingency node so the network/risk views focus on something real for
  // this case, mirroring loadScenario's own reset-to-'A' behavior.
  const selectCaseStudy = useCallback(
    (id: string | null) => {
      setSelectedCaseStudyId(id);
      setVerificationTestCount(10);
      if (id) {
        const cs = getCaseStudy(id);
        setSelectedNodeId(cs?.initiatingContingency.nodeId ?? null);
      } else {
        setSelectedNodeId('A');
      }
      setIsSandboxApplied(false);
      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLastUpdated(now);
      setSimulationTime(now);
    },
    []
  );

  const updateSettings = useCallback((newSettings: Partial<EngineSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Clock tick for simulation time
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      const timeStr = d.toLocaleTimeString('en-US', { hour12: false });
      setSimulationTime(timeStr);
      if (autoRefresh) {
        refreshObservation();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshObservation]);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        activeRoute,
        setActiveRoute,
        scenarios,
        selectedScenario,
        loadScenario,
        dataSourceMode,
        caseStudies,
        selectedCaseStudyId,
        activeCaseStudy,
        isCaseStudyMode,
        selectCaseStudy,
        caseStudyResult,
        domainActionResult,
        futureDomainActions,
        caseStudyError,
        observation,
        activeEvent,
        refreshObservation,
        selectedNodeId,
        setSelectedNodeId,
        selectedNode,
        graphViewMode,
        setGraphViewMode,
        riskScores,
        simulations,
        recommendation,
        isRecommendationAvailable,
        isSandboxApplied,
        applyRecommendationToSandbox,
        resetSandbox,
        verificationResult: activeVerificationResult,
        runVerification,
        isVerifying,
        impactSummary,
        benchmarkResult,
        runBenchmark,
        isBenchmarking,
        settings,
        updateSettings,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isWhyActionModalOpen,
        setIsWhyActionModalOpen,
        isAddWidgetModalOpen,
        setIsAddWidgetModalOpen,
        isNetworkExpanded,
        setIsNetworkExpanded,
        autoRefresh,
        setAutoRefresh,
        simulationTime,
        lastUpdated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
