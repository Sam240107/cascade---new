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
  dataSourceMode: 'PREDEFINED SCENARIO' | 'REALTIME (UNCONNECTED)';

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
  const [dataSourceMode] = useState<'PREDEFINED SCENARIO' | 'REALTIME (UNCONNECTED)'>('PREDEFINED SCENARIO');

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

  // Active scenario
  const selectedScenario = useMemo(() => {
    return scenarios.find((s) => s.id === selectedScenarioId) ?? scenarios[0];
  }, [scenarios, selectedScenarioId]);

  // Generate deterministic observation
  const [observation, setObservation] = useState<Observation>(() => {
    return SensorGenerator.generateObservation(selectedScenario, settings.sensorConfig);
  });

  // Update observation on scenario or sensor setting change
  useEffect(() => {
    const obs = SensorGenerator.generateObservation(selectedScenario, settings.sensorConfig);
    setObservation(obs);
    setIsSandboxApplied(false);
    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
  }, [selectedScenario, settings.sensorConfig]);

  const refreshObservation = useCallback(() => {
    const obs = SensorGenerator.generateObservation(selectedScenario, settings.sensorConfig);
    setObservation(obs);
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLastUpdated(now);
    setSimulationTime(now);
  }, [selectedScenario, settings.sensorConfig]);

  // Active initial event
  const activeEvent = selectedScenario.initialEvent;

  // Selected node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return selectedScenario.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedScenario, selectedNodeId]);

  // Compute Risk Scores
  const riskScores = useMemo(() => {
    return RiskCalculator.calculateRiskScores(observation, selectedScenario, settings.weights);
  }, [observation, selectedScenario, settings.weights]);

  // Simulate Candidate Interventions
  const simulations = useMemo(() => {
    return InterventionEngine.simulateAll(selectedScenario, observation);
  }, [selectedScenario, observation]);

  // Recommend Optimal Action
  const recommendation = useMemo(() => {
    return RecommendationEngine.evaluate(simulations, selectedScenario);
  }, [simulations, selectedScenario]);

  // Initial Verification Result
  const [verificationResult, setVerificationResult] = useState<VerificationResult>(() => {
    const defaultSim = simulations[0] ?? {
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
    return VerificationEngine.runVerification(recommendation, defaultSim, selectedScenario, 10);
  });

  // Re-run verification when recommendation or scenario changes
  const runVerification = useCallback(
    (runsCount = settings.verificationRuns) => {
      setIsVerifying(true);
      const chosenSim =
        simulations.find((s) => s.actionId === recommendation.actionId) ?? simulations[0];
      const result = VerificationEngine.runVerification(
        recommendation,
        chosenSim,
        selectedScenario,
        runsCount
      );
      setVerificationResult(result);
      setIsVerifying(false);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
    },
    [recommendation, simulations, selectedScenario, settings.verificationRuns]
  );

  // Compute Counterfactual Impact Summary
  const impactSummary = useMemo(() => {
    const chosenSim =
      simulations.find((s) => s.actionId === recommendation.actionId) ?? simulations[0];
    const unmitigated = {
      affectedNodes: 7,
      population: 3200,
      critical: 3,
      disruption: 98,
    };
    return ImpactCalculator.calculateImpact(unmitigated, chosenSim);
  }, [simulations, recommendation]);

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
    setSelectedScenarioId(id);
    setSelectedNodeId('A');
    setIsSandboxApplied(false);
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLastUpdated(now);
    setSimulationTime(now);
  }, []);

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
        isSandboxApplied,
        applyRecommendationToSandbox,
        resetSandbox,
        verificationResult,
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
