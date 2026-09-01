import React, { useState } from 'react';
import { useApp } from '../../state/AppContext';
import { X, Plus, Check, LayoutGrid, Zap, Shield, Activity, BarChart2 } from 'lucide-react';

export const AddWidgetModal: React.FC = () => {
  const { isAddWidgetModalOpen, setIsAddWidgetModalOpen, theme } = useApp();

  const availableWidgets = [
    { id: 'network', name: 'Infrastructure Network (Stress & Topology)', category: 'Core', icon: Zap, active: true },
    { id: 'risk', name: 'Risk Prediction Table', category: 'Risk', icon: Shield, active: true },
    { id: 'event', name: 'Real-Time Sensor Telemetry', category: 'Events', icon: Activity, active: true },
    { id: 'simulation', name: 'Counterfactual Simulations', category: 'Simulation', icon: BarChart2, active: true },
    { id: 'global_map', name: 'Global Infrastructure Map', category: 'Geospatial', icon: LayoutGrid, active: true },
    { id: 'revenue', name: 'Revenue & Cost Impact', category: 'Financial', icon: BarChart2, active: true },
  ];

  if (!isAddWidgetModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`rounded-2xl shadow-2xl border max-w-lg w-full p-6 transition-colors ${
          theme === 'dark'
            ? 'bg-[#0f1018] border-white/15 text-white shadow-black/90'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-4 border-b mb-4 ${
            theme === 'dark' ? 'border-white/10' : 'border-slate-100'
          }`}
        >
          <div>
            <h2 className="text-base font-black">Customize Dashboard Widgets</h2>
            <p className="text-xs opacity-60">Manage visual tiles and command center monitors</p>
          </div>
          <button
            onClick={() => setIsAddWidgetModalOpen(false)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'hover:bg-white/10 text-zinc-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Widget Grid */}
        <div className="space-y-2.5 my-4">
          {availableWidgets.map((w) => {
            const Icon = w.icon;
            return (
              <div
                key={w.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  theme === 'dark'
                    ? 'bg-[#141522] border-white/10'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs">{w.name}</div>
                    <div className="text-[10px] opacity-60">{w.category}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                  <Check size={12} /> Active
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsAddWidgetModalOpen(false)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Save Layout
          </button>
        </div>
      </div>
    </div>
  );
};
