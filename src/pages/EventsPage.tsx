import React from 'react';
import { useApp } from '../state/AppContext';
import { SubHeader } from '../components/layout/SubHeader';
import { Target, AlertTriangle, ShieldCheck, Activity, Clock, Zap } from 'lucide-react';

export const EventsPage: React.FC = () => {
  const { observation, selectedScenario, setSelectedNodeId, isCaseStudyMode } = useApp();

  // These two illustrative correlated events are specific to the Urban Grid
  // demo scenario (nodes 'B'/'C') and are not real/modelled data — they must
  // not appear when a real-world case study (a different network entirely)
  // is active, or the page would display fabricated events for nodes that
  // don't exist in that case's modelled network.
  const events = isCaseStudyMode
    ? [...observation.events]
    : [
        ...observation.events,
        {
          id: 'evt-corr-2',
          name: 'Secondary Thermal Elevation on Feeder B-E',
          type: 'Cascading Overload' as const,
          nodeId: 'B',
          nodeName: 'Substation B',
          severity: 'Moderate' as const,
          detectedAt: '12:24:02 PM',
          confidence: 0.79,
          currentObservedValue: 72,
          normalRange: [40, 60] as [number, number],
          deltaPercentage: 18,
          history: [],
        },
        {
          id: 'evt-corr-3',
          name: 'Reactive Power Deviation at Branch C-D',
          type: 'Line Sag' as const,
          nodeId: 'C',
          nodeName: 'Substation C',
          severity: 'Low' as const,
          detectedAt: '12:24:18 PM',
          confidence: 0.84,
          currentObservedValue: 74,
          normalRange: [45, 65] as [number, number],
          deltaPercentage: 12,
          history: [],
        },
      ];

  return (
    <div className="flex flex-col min-h-full pb-8">
      <SubHeader title="Event & Correlation Analysis" subtitle="Cross-sensor correlation & disturbance telemetry" />

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Correlated Events</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{events.length}</div>
            <div className="text-xs text-rose-600 font-semibold mt-0.5">1 Critical / High Severity</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Telemetry Quality</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{observation.overallDataQuality}%</div>
            <div className="text-xs text-emerald-600 font-semibold mt-0.5">Good Signal-to-Noise Ratio</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Confidence</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">87%</div>
            <div className="text-xs text-slate-500 mt-0.5">Weighted across sensor array</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Primary Anomaly</div>
            <div className="text-base font-extrabold text-rose-600 mt-1 truncate">{selectedScenario.initialEvent.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">{selectedScenario.initialEvent.detectedAt}</div>
          </div>
        </div>

        {/* Event Timeline Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-sm text-slate-900 mb-1">Observed Disturbance Sequence</h3>
          <p className="text-xs text-slate-500 mb-4">Chronological sensor readings and estimated propagation velocity</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3 font-medium">Timestamp</th>
                  <th className="py-2.5 px-3 font-medium">Event Name</th>
                  <th className="py-2.5 px-3 font-medium">Target Node</th>
                  <th className="py-2.5 px-3 font-medium">Type</th>
                  <th className="py-2.5 px-3 font-medium">Observed Value</th>
                  <th className="py-2.5 px-3 font-medium">Severity</th>
                  <th className="py-2.5 px-3 font-medium">Confidence</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-600">{evt.detectedAt}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{evt.name}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setSelectedNodeId(evt.nodeId)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px]"
                      >
                        Node {evt.nodeId} ({evt.nodeName})
                      </button>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{evt.type}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {isCaseStudyMode
                        ? `${evt.currentObservedValue} MW`
                        : `${evt.currentObservedValue}% (Δ +${evt.deltaPercentage}%)`}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          evt.severity === 'Critical' || evt.severity === 'High'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : evt.severity === 'Moderate'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-700">{Math.round(evt.confidence * 100)}%</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedNodeId(evt.nodeId)}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        Inspect Node
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
