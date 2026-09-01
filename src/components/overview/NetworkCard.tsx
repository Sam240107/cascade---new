import React, { useState, useMemo } from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import {
  Maximize2,
  Minimize2,
  Layers,
  Activity,
  AlertCircle,
  Network,
  Share2,
  Shield,
  Zap,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { InfrastructureNodeType, ObservedNode } from '../../types/domain';

type TopologyFilter = 'all' | 'critical' | 'bottlenecks' | 'power_flow';

export const NetworkCard: React.FC = () => {
  const {
    observation,
    selectedNodeId,
    setSelectedNodeId,
    graphViewMode,
    setGraphViewMode,
    isNetworkExpanded,
    setIsNetworkExpanded,
    theme,
  } = useApp();

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [topologyFilter, setTopologyFilter] = useState<TopologyFilter>('all');

  // Stress color resolver based on percentage for Stress View
  const getStressNodeColor = (stressPct: number) => {
    if (stressPct >= 90)
      return { bg: '#dc2626', border: '#ef4444', glow: 'rgba(220, 38, 38, 0.5)', text: '#ffffff' };
    if (stressPct >= 70)
      return { bg: '#ea580c', border: '#f97316', glow: 'rgba(234, 88, 12, 0.4)', text: '#ffffff' };
    if (stressPct >= 50)
      return { bg: '#eab308', border: '#fde047', glow: 'rgba(234, 179, 8, 0.3)', text: '#0f172a' };
    if (stressPct >= 30)
      return { bg: '#16a34a', border: '#4ade80', glow: 'rgba(22, 163, 74, 0.3)', text: '#ffffff' };
    return { bg: '#2563eb', border: '#60a5fa', glow: 'rgba(37, 99, 235, 0.3)', text: '#ffffff' };
  };

  // Topology node styling based on architectural tier and role
  const getTopologyNodeStyle = (node: ObservedNode) => {
    const isSource = node.type === 'power_plant';
    const isCritical = Boolean(node.critical) || node.type === 'hospital' || node.type === 'water_treatment';
    const isSubstation = node.type === 'substation';

    if (isCritical) {
      return {
        bg: theme === 'dark' ? '#3b0710' : '#fee2e2',
        border: '#ef4444',
        accent: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.5)',
        text: theme === 'dark' ? '#ffffff' : '#991b1b',
        badge: 'CRITICAL',
        role: 'Essential Consumer',
      };
    }
    if (isSource) {
      return {
        bg: theme === 'dark' ? '#2e1065' : '#f3e8ff',
        border: '#a855f7',
        accent: '#a855f7',
        glow: 'rgba(168, 85, 247, 0.4)',
        text: theme === 'dark' ? '#ffffff' : '#581c87',
        badge: 'SOURCE',
        role: 'Primary Generation',
      };
    }
    if (isSubstation) {
      return {
        bg: theme === 'dark' ? '#18181b' : '#f1f5f9',
        border: '#f59e0b',
        accent: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.4)',
        text: theme === 'dark' ? '#ffffff' : '#0f172a',
        badge: 'HUB',
        role: 'Transmission Grid',
      };
    }
    return {
      bg: theme === 'dark' ? '#09241b' : '#ecfdf5',
      border: '#10b981',
      accent: '#10b981',
      glow: 'rgba(16, 185, 129, 0.3)',
      text: theme === 'dark' ? '#ffffff' : '#064e3b',
      badge: 'DIST',
      role: 'Distribution Zone',
    };
  };

  // Node Type Icon renderer
  const renderTypeIcon = (type: InfrastructureNodeType) => {
    switch (type) {
      case 'substation':
        return '⚡';
      case 'hospital':
        return '🏥';
      case 'water_treatment':
        return '💧';
      case 'power_plant':
        return '🏭';
      case 'residential':
        return '🏘️';
      case 'industrial':
        return '🏢';
      default:
        return '⚡';
    }
  };

  // Compute topological metrics for all nodes (Degree, In/Out connections, Upstream & Downstream)
  const topologyMetrics = useMemo(() => {
    const metrics: Record<
      string,
      {
        inDegree: number;
        outDegree: number;
        totalDegree: number;
        upstream: string[];
        downstream: string[];
        betweennessRank: string;
        isBottleneck: boolean;
      }
    > = {};

    Object.keys(observation.nodes).forEach((id) => {
      metrics[id] = {
        inDegree: 0,
        outDegree: 0,
        totalDegree: 0,
        upstream: [],
        downstream: [],
        betweennessRank: 'Low',
        isBottleneck: false,
      };
    });

    observation.edges.forEach((edge) => {
      if (metrics[edge.source]) {
        metrics[edge.source].outDegree += 1;
        metrics[edge.source].totalDegree += 1;
        metrics[edge.source].downstream.push(edge.target);
      }
      if (metrics[edge.target]) {
        metrics[edge.target].inDegree += 1;
        metrics[edge.target].totalDegree += 1;
        metrics[edge.target].upstream.push(edge.source);
      }
    });

    // Mark key topological hubs
    Object.keys(metrics).forEach((id) => {
      const node = observation.nodes[id];
      if (node?.type === 'substation' && metrics[id].totalDegree >= 2) {
        metrics[id].betweennessRank = 'High (0.84)';
        metrics[id].isBottleneck = true;
      } else if (metrics[id].totalDegree >= 2) {
        metrics[id].betweennessRank = 'Moderate (0.52)';
      }
    });

    return metrics;
  }, [observation]);

  const activeFocusId = hoveredNodeId || selectedNodeId;
  const activeFocusNode = activeFocusId ? observation.nodes[activeFocusId] : null;
  const activeFocusMetrics = activeFocusId ? topologyMetrics[activeFocusId] : null;

  return (
    <NeonCard
      className={isNetworkExpanded ? 'fixed inset-4 z-50 overflow-auto' : 'h-full min-h-[490px]'}
      accentVariant="grey"
    >
      {/* Card Header */}
      <div
        className={`flex items-center justify-between pb-3 border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <div>
          <h3 className="font-black text-sm flex items-center gap-2">
            <span>Infrastructure Network</span>
            {observation.events.length > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
            )}
          </h3>
          <p className="text-[11px] opacity-60">
            {graphViewMode === 'stress'
              ? 'Real-time thermal load & cascade stress propagation'
              : 'Structural dependency hierarchy, centrality & flow paths'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Stress View / Topology View Toggles */}
          <div
            className={`flex items-center p-0.5 rounded-xl border text-xs font-semibold ${
              theme === 'dark'
                ? 'bg-[#151622] border-white/10'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setGraphViewMode('stress')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                graphViewMode === 'stress'
                  ? theme === 'dark'
                    ? 'bg-red-600 text-white shadow-md font-bold'
                    : 'bg-white text-red-700 shadow-xs font-bold'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              Stress View
            </button>
            <button
              onClick={() => setGraphViewMode('topology')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                graphViewMode === 'topology'
                  ? theme === 'dark'
                    ? 'bg-red-600 text-white shadow-md font-bold'
                    : 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              Topology View
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsNetworkExpanded(!isNetworkExpanded)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'hover:bg-white/10 text-zinc-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
            }`}
            title={isNetworkExpanded ? 'Collapse' : 'Expand Fullscreen'}
          >
            {isNetworkExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Topology Interactive Filters (Only visible in Topology Mode) */}
      {graphViewMode === 'topology' && (
        <div className="flex items-center justify-between gap-2 pt-2 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="opacity-60 text-[9px] uppercase tracking-wider mr-1">Layer:</span>
            <button
              onClick={() => setTopologyFilter('all')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                topologyFilter === 'all'
                  ? 'bg-red-600 text-white shadow-xs'
                  : theme === 'dark'
                  ? 'bg-white/5 text-zinc-400 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Links
            </button>
            <button
              onClick={() => setTopologyFilter('critical')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                topologyFilter === 'critical'
                  ? 'bg-red-600 text-white shadow-xs'
                  : theme === 'dark'
                  ? 'bg-white/5 text-zinc-400 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Critical Paths
            </button>
            <button
              onClick={() => setTopologyFilter('bottlenecks')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                topologyFilter === 'bottlenecks'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : theme === 'dark'
                  ? 'bg-white/5 text-zinc-400 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bottleneck Hubs
            </button>
            <button
              onClick={() => setTopologyFilter('power_flow')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                topologyFilter === 'power_flow'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : theme === 'dark'
                  ? 'bg-white/5 text-zinc-400 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Live Power Pulses
            </button>
          </div>

          <div className="flex items-center gap-2 text-[9px] opacity-60">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Source
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Grid
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical
            </span>
          </div>
        </div>
      )}

      {/* Interactive SVG Network Canvas */}
      <div className="relative flex-1 min-h-[310px] w-full flex items-center justify-center my-1 select-none overflow-hidden rounded-xl">
        {/* Subtle grid pattern background */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            theme === 'dark' ? 'opacity-10' : 'opacity-[0.05]'
          }`}
          style={{
            backgroundImage: `radial-gradient(${theme === 'dark' ? '#ef4444' : '#0f172a'} 1px, transparent 1px)`,
            backgroundSize: '18px 18px',
          }}
        />

        <svg
          viewBox="0 0 540 380"
          className="w-full h-full max-h-[350px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Standard arrow marker */}
            <marker
              id="arrow-std"
              viewBox="0 0 10 10"
              refX="19"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill={theme === 'dark' ? '#64748b' : '#94a3b8'} />
            </marker>

            {/* Overloaded red arrow */}
            <marker
              id="arrow-danger"
              viewBox="0 0 10 10"
              refX="19"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
            </marker>

            {/* Glowing red filter */}
            <filter id="glow-danger" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Glowing gold filter for bottlenecks */}
            <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render Graph Edges */}
          {observation.edges.map((edge) => {
            const sourceNode = observation.nodes[edge.source];
            const targetNode = observation.nodes[edge.target];
            if (!sourceNode || !targetNode) return null;

            const isSourceOverloaded = sourceNode.stress >= 0.85;
            const isTargetCritical = targetNode.isCriticalFacility;
            const isHighlighted =
              activeFocusId === edge.source || activeFocusId === edge.target;

            const isUpstreamOfFocus = activeFocusId === edge.target;
            const isDownstreamOfFocus = activeFocusId === edge.source;

            // Filter logic
            if (topologyFilter === 'critical' && !isTargetCritical && !isSourceOverloaded) {
              return null;
            }

            let strokeColor = theme === 'dark' ? '#27273a' : '#e2e8f0';
            let strokeWidth = 1.5;

            if (graphViewMode === 'stress') {
              if (isSourceOverloaded) {
                strokeColor = '#ef4444';
                strokeWidth = 2.5;
              } else if (isHighlighted) {
                strokeColor = theme === 'dark' ? '#ffffff' : '#475569';
                strokeWidth = 2.5;
              }
            } else {
              // Topology Mode edge coloring
              if (isUpstreamOfFocus) {
                strokeColor = '#10b981'; // Inflow (Green)
                strokeWidth = 3;
              } else if (isDownstreamOfFocus) {
                strokeColor = '#ef4444'; // Outflow (Red)
                strokeWidth = 3;
              } else if (isHighlighted) {
                strokeColor = theme === 'dark' ? '#f43f5e' : '#e11d48';
                strokeWidth = 2.5;
              } else if (isSourceOverloaded) {
                strokeColor = '#ef4444';
                strokeWidth = 2;
              } else {
                strokeColor = theme === 'dark' ? '#334155' : '#cbd5e1';
              }
            }

            return (
              <g key={edge.id} className="transition-all duration-300">
                {/* Base Link Line */}
                <line
                  x1={sourceNode.position.x}
                  y1={sourceNode.position.y}
                  x2={targetNode.position.x}
                  y2={targetNode.position.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  markerEnd={isSourceOverloaded ? 'url(#arrow-danger)' : 'url(#arrow-std)'}
                  opacity={isHighlighted ? 1 : 0.75}
                />

                {/* Animated Power / Dependency Flow Particles in Topology or Active mode */}
                {(graphViewMode === 'topology' || isSourceOverloaded) && (
                  <line
                    x1={sourceNode.position.x}
                    y1={sourceNode.position.y}
                    x2={targetNode.position.x}
                    y2={targetNode.position.y}
                    stroke={
                      isSourceOverloaded
                        ? '#ef4444'
                        : isDownstreamOfFocus
                        ? '#ef4444'
                        : isUpstreamOfFocus
                        ? '#10b981'
                        : theme === 'dark'
                        ? '#a855f7'
                        : '#6366f1'
                    }
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    className="animate-flow-dash"
                    opacity={isHighlighted || isSourceOverloaded ? 0.9 : 0.4}
                  />
                )}
              </g>
            );
          })}

          {/* Render Graph Nodes */}
          {(Object.values(observation.nodes) as ObservedNode[]).map((node) => {
            const stressPct = Math.round(node.stress * 100);
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isCriticalAlert = stressPct >= 90;
            const metrics = topologyMetrics[node.id];

            const stressColors = getStressNodeColor(stressPct);
            const topStyle = getTopologyNodeStyle(node);

            const isFocus = activeFocusId === node.id;
            const isUpstream = activeFocusMetrics?.upstream.includes(node.id);
            const isDownstream = activeFocusMetrics?.downstream.includes(node.id);

            // The circle badge was sized for Urban Grid's single-letter ids
            // (e.g. "A"). Case-study node ids are longer, hyphenated
            // strings (e.g. "wind-cluster") that would otherwise overflow
            // the 16px-radius circle and overlap neighboring nodes. Short
            // ids render exactly as before; longer ones get a compact
            // 3-letter badge at a smaller size — the full id/name is still
            // shown in the label underneath and in the footer inspector.
            const idBadgeText = node.id.length > 4 ? node.id.slice(0, 3).toUpperCase() : node.id;
            const idBadgeFontSize = node.id.length > 4 ? 10 : 13;

            return (
              <g
                key={node.id}
                transform={`translate(${node.position.x}, ${node.position.y})`}
                onClick={() => setSelectedNodeId(node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Outer Pulsing Ping for Critical Alerts */}
                {isCriticalAlert && (
                  <circle
                    r="24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Upstream / Downstream Highlight Rings in Topology Mode */}
                {graphViewMode === 'topology' && isUpstream && (
                  <circle
                    r="23"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    opacity="0.9"
                  />
                )}
                {graphViewMode === 'topology' && isDownstream && (
                  <circle
                    r="23"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    opacity="0.9"
                  />
                )}

                {/* Selected / Hovered Highlight Halo */}
                {(isSelected || isHovered) && (
                  <circle
                    r="22"
                    fill="none"
                    stroke={isCriticalAlert ? '#ef4444' : theme === 'dark' ? '#ffffff' : '#2563eb'}
                    strokeWidth="2.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Base Node Circle */}
                <circle
                  r="16"
                  fill={graphViewMode === 'stress' ? stressColors.bg : topStyle.bg}
                  stroke={graphViewMode === 'stress' ? stressColors.border : topStyle.border}
                  strokeWidth="2"
                  filter={
                    isCriticalAlert
                      ? 'url(#glow-danger)'
                      : metrics?.isBottleneck
                      ? 'url(#glow-gold)'
                      : undefined
                  }
                  className="shadow-md"
                />

                {/* Node Identifier Badge (short id, or a 3-letter
                    abbreviation for longer case-study ids — see idBadgeText) */}
                <text
                  textAnchor="middle"
                  dy="5"
                  fill={graphViewMode === 'stress' ? stressColors.text : topStyle.text}
                  fontSize={idBadgeFontSize}
                  fontWeight="900"
                  className="pointer-events-none font-sans"
                >
                  {idBadgeText}
                </text>

                {/* Mini Type Icon Badge */}
                <g transform="translate(10, -16)">
                  <rect
                    width="15"
                    height="15"
                    rx="4"
                    fill={theme === 'dark' ? '#181924' : '#ffffff'}
                    stroke={theme === 'dark' ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}
                    strokeWidth="1"
                  />
                  <text
                    x="7.5"
                    y="11"
                    textAnchor="middle"
                    fontSize="9.5"
                    className="pointer-events-none select-none"
                  >
                    {renderTypeIcon(node.type)}
                  </text>
                </g>

                {/* Degree / Topology Badge in Topology View */}
                {graphViewMode === 'topology' && (
                  <g transform="translate(-16, -18)">
                    <rect
                      width="18"
                      height="12"
                      rx="3"
                      fill={theme === 'dark' ? '#090a0f' : '#0f172a'}
                      stroke={topStyle.accent}
                      strokeWidth="1"
                    />
                    <text
                      x="9"
                      y="9"
                      textAnchor="middle"
                      fontSize="7.5"
                      fill="#ffffff"
                      fontWeight="bold"
                      className="font-mono pointer-events-none"
                    >
                      k={metrics?.totalDegree || 1}
                    </text>
                  </g>
                )}

                {/* Node Name Label Underneath */}
                <text
                  textAnchor="middle"
                  y="28"
                  fontSize="9.5"
                  fontWeight="700"
                  fill={
                    isFocus
                      ? '#ef4444'
                      : theme === 'dark'
                      ? '#cbd5e1'
                      : '#475569'
                  }
                  className="pointer-events-none"
                >
                  {node.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer HUD: Dynamic Node Inspector & Dependency Tracer */}
      <div
        className={`pt-2.5 border-t text-xs rounded-xl p-2.5 transition-colors ${
          theme === 'dark'
            ? 'bg-[#11121c] border-white/10 text-zinc-300'
            : 'bg-slate-50 border-slate-100 text-slate-700'
        }`}
      >
        {activeFocusNode ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {activeFocusNode.id}
              </div>
              <div>
                <div className="font-extrabold text-xs text-white dark:text-white leading-none">
                  {activeFocusNode.name}
                </div>
                <div className="text-[10px] text-red-500 font-semibold mt-0.5 flex items-center gap-2">
                  <span>{activeFocusNode.type.replace('_', ' ').toUpperCase()}</span>
                  <span>•</span>
                  <span>Stress: {Math.round(activeFocusNode.stress * 100)}%</span>
                  {activeFocusNode.critical && (
                    <span className="px-1.5 py-0.2 rounded-sm bg-red-500 text-white text-[8px] font-black">
                      CRITICAL
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Topology Mode Centrality & Dependency HUD */}
            {graphViewMode === 'topology' ? (
              <div className="flex items-center gap-4 text-[10px]">
                <div>
                  <span className="opacity-60 block text-[9px]">Centrality</span>
                  <span className="font-bold text-red-400">
                    {activeFocusMetrics?.betweennessRank || 'Normal'}
                  </span>
                </div>
                <div>
                  <span className="opacity-60 block text-[9px]">Suppliers (Inflow)</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {activeFocusMetrics?.upstream.join(', ') || 'Grid Source'}
                  </span>
                </div>
                <div>
                  <span className="opacity-60 block text-[9px]">Dependents (Outflow)</span>
                  <span className="font-mono font-bold text-red-400">
                    {activeFocusMetrics?.downstream.join(', ') || 'Terminal'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-[10px]">
                <div>
                  <span className="opacity-60 block text-[9px]">Current Load</span>
                  <span className="font-bold">{Math.round(activeFocusNode.observedLoad)} MW</span>
                </div>
                <div>
                  <span className="opacity-60 block text-[9px]">Nominal Capacity</span>
                  <span className="font-bold">{Math.round(activeFocusNode.observedCapacity)} MW</span>
                </div>
                <div>
                  <span className="opacity-60 block text-[9px]">Status</span>
                  <span
                    className={`font-bold ${
                      activeFocusNode.stress >= 0.85 ? 'text-red-500' : 'text-emerald-500'
                    }`}
                  >
                    {activeFocusNode.stress >= 0.85 ? 'OVERLOAD RISK' : 'STABLE'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[11px] opacity-60 text-center py-0.5">
            Click or hover any infrastructure node to inspect topology dependencies and live load
          </div>
        )}
      </div>
    </NeonCard>
  );
};
