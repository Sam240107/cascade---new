import React, { useMemo } from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { Maximize2, AlertCircle, Clock } from 'lucide-react';

export const EventDetailsCard: React.FC = () => {
  const { activeEvent, observation, setActiveRoute, simulationTime, theme } = useApp();

  const confidencePct = Math.round(activeEvent.confidence * 100);

  // Derive dynamic time series points anchored to the live simulation clock
  const dynamicHistory = useMemo(() => {
    // Parse hours and minutes from simulationTime (e.g. "12:34:56" -> 12:34)
    const [hStr, mStr] = simulationTime.split(':');
    const h = parseInt(hStr || '12', 10);
    const m = parseInt(mStr || '30', 10);

    const formatTime = (hours: number, minutes: number) => {
      let normM = minutes;
      let normH = hours;
      while (normM < 0) {
        normM += 60;
        normH -= 1;
      }
      if (normH < 0) normH += 24;
      return `${String(normH).padStart(2, '0')}:${String(normM).padStart(2, '0')}`;
    };

    return [
      { time: formatTime(h, m - 15), observed: 38, normal: 50 },
      { time: formatTime(h, m - 10), observed: 52, normal: 50 },
      { time: formatTime(h, m - 5), observed: 68, normal: 50 },
      { time: formatTime(h, m), observed: Math.round(activeEvent.currentObservedValue), normal: 50 },
    ];
  }, [simulationTime, activeEvent.currentObservedValue]);

  // SVG Chart sizing
  const width = 280;
  const height = 110;
  const padding = 24;

  const getX = (index: number) => padding + (index / (dynamicHistory.length - 1)) * (width - 2 * padding);
  const getY = (val: number) => height - padding - (val / 100) * (height - 2 * padding);

  const observedPath = dynamicHistory
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.observed)}`)
    .join(' ');

  const normalPath = dynamicHistory
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.normal)}`)
    .join(' ');

  return (
    <NeonCard className="h-full min-h-[490px]" accentVariant="grey">
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-3 border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <div>
          <h3 className="font-bold text-sm">Event Details</h3>
          <p className="text-[11px] opacity-60">Real-time sensor telemetry & deviation</p>
        </div>
        <button
          onClick={() => setActiveRoute('events')}
          className={`p-1 rounded-lg transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'hover:bg-white/10 text-zinc-400 hover:text-white'
              : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
          }`}
          title="Open Event Explorer"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Event Title & Confidence Ring Row */}
      <div className="my-2">
        <div className="text-sm font-extrabold text-red-600 dark:text-red-400 truncate mb-3">
          {activeEvent.name}
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Stats List */}
          <div className="space-y-1.5 text-xs flex-1">
            <div className="flex justify-between items-center">
              <span className="opacity-60">Current Load</span>
              <span className="font-bold text-red-500">{activeEvent.currentObservedValue}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-60">Normal Load</span>
              <span className="font-medium">{activeEvent.normalRange[1]}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-60">Delta</span>
              <span className="font-bold text-red-600 dark:text-red-400">+{activeEvent.deltaPercentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-60">Time to Failure</span>
              <span className="font-bold text-red-600 dark:text-red-400">6 min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-60">Data Quality</span>
              <span className="font-semibold text-emerald-500">{observation.overallDataQuality}%</span>
            </div>
          </div>

          {/* Confidence Ring Gauge */}
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className={theme === 'dark' ? 'text-zinc-800' : 'text-slate-100'}
                strokeWidth="3.2"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-red-600 dark:text-red-500 transition-all duration-500"
                strokeDasharray={`${confidencePct}, 100`}
                strokeWidth="3.2"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-black leading-none text-white dark:text-white">
                {confidencePct}%
              </span>
              <span className="text-[8.5px] opacity-60 font-medium mt-0.5">Confidence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time-Series Load (%) Chart */}
      <div
        className={`mt-2 pt-2 border-t ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <div className="flex justify-between items-center text-[10px] opacity-70 mb-1">
          <span className="font-bold">Load (%) vs Time</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-red-600 rounded-full" />
              Observed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 border-t border-dashed border-blue-400" />
              Normal
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <div
          className={`w-full rounded-xl border p-1 ${
            theme === 'dark'
              ? 'bg-[#12131e] border-white/10'
              : 'bg-slate-50/70 border-slate-100'
          }`}
        >
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[95px] overflow-visible">
            {/* Grid lines */}
            <line
              x1={padding}
              y1={getY(25)}
              x2={width - padding}
              y2={getY(25)}
              stroke={theme === 'dark' ? '#27273a' : '#e2e8f0'}
              strokeDasharray="2 2"
            />
            <line
              x1={padding}
              y1={getY(50)}
              x2={width - padding}
              y2={getY(50)}
              stroke={theme === 'dark' ? '#27273a' : '#e2e8f0'}
              strokeDasharray="2 2"
            />
            <line
              x1={padding}
              y1={getY(75)}
              x2={width - padding}
              y2={getY(75)}
              stroke={theme === 'dark' ? '#27273a' : '#e2e8f0'}
              strokeDasharray="2 2"
            />
            <line
              x1={padding}
              y1={getY(100)}
              x2={width - padding}
              y2={getY(100)}
              stroke={theme === 'dark' ? '#27273a' : '#e2e8f0'}
              strokeDasharray="2 2"
            />

            {/* Y-axis Labels */}
            <text
              x={padding - 4}
              y={getY(0) + 3}
              textAnchor="end"
              fontSize="8"
              fill={theme === 'dark' ? '#64748b' : '#94a3b8'}
            >
              0
            </text>
            <text
              x={padding - 4}
              y={getY(50) + 3}
              textAnchor="end"
              fontSize="8"
              fill={theme === 'dark' ? '#64748b' : '#94a3b8'}
            >
              50
            </text>
            <text
              x={padding - 4}
              y={getY(100) + 3}
              textAnchor="end"
              fontSize="8"
              fill={theme === 'dark' ? '#64748b' : '#94a3b8'}
            >
              100
            </text>

            {/* Normal Range line (blue dashed) */}
            <path d={normalPath} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Observed line (red curve) */}
            <path
              d={observedPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Data points */}
            {dynamicHistory.map((d, i) => (
              <g key={i}>
                <circle
                  cx={getX(i)}
                  cy={getY(d.observed)}
                  r="3.5"
                  fill="#ef4444"
                  stroke={theme === 'dark' ? '#0c0d13' : '#ffffff'}
                  strokeWidth="1.5"
                />
                <text
                  x={getX(i)}
                  y={height - 5}
                  textAnchor="middle"
                  fontSize="8"
                  fill={theme === 'dark' ? '#94a3b8' : '#64748b'}
                  className="font-mono"
                >
                  {d.time}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </NeonCard>
  );
};
