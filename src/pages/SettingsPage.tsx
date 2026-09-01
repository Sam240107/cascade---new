import React from 'react';
import { useApp } from '../state/AppContext';
import { SubHeader } from '../components/layout/SubHeader';
import { Sliders, RotateCcw, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const handleWeightChange = (key: keyof typeof settings.weights, value: number) => {
    updateSettings({
      weights: {
        ...settings.weights,
        [key]: value,
      },
    });
  };

  const handleReset = () => {
    updateSettings({
      weights: {
        w1_stress: 0.35,
        w2_inverseTimeToFailure: 0.25,
        w3_redundancyRisk: 0.20,
        w4_loadTransferExposure: 0.20,
      },
      sensorNoiseSigma: 2.5,
      sensorDropoutRate: 0.05,
      thermalOverloadThreshold: 90,
      evaluationMode: 'tuning',
    });
  };

  return (
    <div className="flex flex-col min-h-full pb-8">
      <SubHeader title="System Calibration & Settings" subtitle="Deterministic engine parameters and sensor generation parameters" />

      <div className="p-6 space-y-6 max-w-[1200px] mx-auto w-full">
        {/* Risk Score Weights Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Multi-Factor Risk Weights</h3>
              <p className="text-xs text-slate-500">
                Sum of weights = {(settings.weights.w1_stress + settings.weights.w2_inverseTimeToFailure + settings.weights.w3_redundancyRisk + settings.weights.w4_loadTransferExposure).toFixed(2)} (Target: 1.00)
              </p>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={12} />
              Reset Defaults
            </button>
          </div>

          <div className="space-y-4">
            {/* Weight 1 */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>w₁ — Stress Level Weight</span>
                <span className="font-mono font-bold text-rose-600">{settings.weights.w1_stress.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={settings.weights.w1_stress}
                onChange={(e) => handleWeightChange('w1_stress', parseFloat(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            {/* Weight 2 */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>w₂ — Inverse Time-to-Failure (1/TTF) Weight</span>
                <span className="font-mono font-bold text-rose-600">{settings.weights.w2_inverseTimeToFailure.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={settings.weights.w2_inverseTimeToFailure}
                onChange={(e) => handleWeightChange('w2_inverseTimeToFailure', parseFloat(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            {/* Weight 3 */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>w₃ — Redundancy Loss Risk Weight</span>
                <span className="font-mono font-bold text-rose-600">{settings.weights.w3_redundancyRisk.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={settings.weights.w3_redundancyRisk}
                onChange={(e) => handleWeightChange('w3_redundancyRisk', parseFloat(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            {/* Weight 4 */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>w₄ — Load Transfer Exposure Weight</span>
                <span className="font-mono font-bold text-rose-600">{settings.weights.w4_loadTransferExposure.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={settings.weights.w4_loadTransferExposure}
                onChange={(e) => handleWeightChange('w4_loadTransferExposure', parseFloat(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Sensor & Evaluation Parameters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 pb-3 border-b border-slate-100">
            Sensor Noise & Benchmark Isolation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Sensor Noise Standard Deviation (σ in MW)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={settings.sensorNoiseSigma}
                onChange={(e) => updateSettings({ sensorNoiseSigma: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:outline-rose-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Sensor Dropout / Null Reading Probability
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="0.25"
                value={settings.sensorDropoutRate}
                onChange={(e) => updateSettings({ sensorDropoutRate: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:outline-rose-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <label className="font-semibold text-slate-800 block mb-2">
              Evaluation Mode Partition
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="evalMode"
                  checked={settings.evaluationMode === 'tuning'}
                  onChange={() => updateSettings({ evaluationMode: 'tuning' })}
                  className="accent-rose-600"
                />
                <span className="text-xs font-semibold text-slate-700">Tuning & Iteration Mode</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="evalMode"
                  checked={settings.evaluationMode === 'heldout'}
                  onChange={() => updateSettings({ evaluationMode: 'heldout' })}
                  className="accent-rose-600"
                />
                <span className="text-xs font-semibold text-slate-700">Frozen Held-Out Evaluation Mode</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
