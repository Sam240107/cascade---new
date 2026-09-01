import React, { useState } from 'react';
import { useApp } from '../../state/AppContext';
import {
  Search,
  Bell,
  Settings,
  Plus,
  ChevronDown,
  Menu,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    setIsAddWidgetModalOpen,
    setActiveRoute,
    refreshObservation,
    runVerification,
    isVerifying,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    simulationTime,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header
      className={`sticky top-0 z-20 px-6 py-2.5 flex items-center justify-between gap-4 transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-[#0a0a0f] border-b border-white/10 text-white shadow-md'
          : 'bg-white border-b border-slate-200 text-slate-900 shadow-2xs'
      }`}
    >
      {/* Left side: Hamburger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'text-zinc-400 hover:text-white hover:bg-white/10'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title={isSidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
        >
          <Menu size={18} />
        </button>

        {/* Global Search Field */}
        <div className="relative w-full max-w-md">
          <Search
            size={15}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
              theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search grid nodes, sensors, topologies..."
            className={`w-full pl-9 pr-4 py-1.5 rounded-xl text-xs transition-all focus:outline-hidden ${
              theme === 'dark'
                ? 'bg-[#14151f] border border-white/10 text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
                : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
            }`}
          />
        </div>
      </div>

      {/* Right side: Theme Toggle, Date, Notifications, Settings, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Theme Toggle Button (Default White -> Black/White/Red Theme) */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#181924] border-red-500/40 text-red-400 hover:bg-red-950/40 hover:text-red-300 shadow-sm shadow-red-950/50'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Spider-Man Dark Theme (Black, White & Red)'}
        >
          {theme === 'dark' ? (
            <>
              <Moon size={14} className="text-red-400 animate-pulse" />
              <span className="text-[11px] tracking-wide">Dark: Noir</span>
            </>
          ) : (
            <>
              <Sun size={14} className="text-amber-500" />
              <span className="text-[11px]">Light Mode</span>
            </>
          )}
        </button>

        {/* Live Simulation Clock Pill */}
        <div
          className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-xl text-xs border ${
            theme === 'dark'
              ? 'bg-[#14151f] border-white/10 text-zinc-300'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <Zap size={13} className="text-red-500 animate-pulse" />
          <span className="font-mono font-bold tracking-tight text-red-500">{simulationTime}</span>
        </div>

        {/* Edit / Customize quick button */}
        <button
          onClick={() => setIsAddWidgetModalOpen(true)}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'text-zinc-400 hover:text-white hover:bg-white/10'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title="Customize Dashboard Layout"
        >
          <Edit2 size={15} />
        </button>

        {/* Refresh Simulation */}
        <button
          onClick={() => {
            refreshObservation();
            runVerification();
          }}
          disabled={isVerifying}
          className={`p-1.5 rounded-xl transition-colors relative cursor-pointer ${
            theme === 'dark'
              ? 'text-zinc-400 hover:text-white hover:bg-white/10'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title="Re-run Simulation & Refresh Telemetry"
        >
          <RefreshCw size={15} className={isVerifying ? 'animate-spin text-red-500' : ''} />
        </button>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-1.5 rounded-xl transition-colors relative cursor-pointer ${
              theme === 'dark'
                ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[8.5px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-black">
              1
            </span>
          </button>

          {showNotifications && (
            <div
              className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 border ${
                theme === 'dark'
                  ? 'bg-[#101117] border-white/15 text-white'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div
                className={`flex items-center justify-between pb-2 border-b mb-2 ${
                  theme === 'dark' ? 'border-white/10' : 'border-slate-100'
                }`}
              >
                <span className="text-xs font-bold">Cascade Sentinel Alerts</span>
                <span className="text-[10px] text-red-500 font-semibold cursor-pointer">
                  Mark all read
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div
                  className={`p-2 rounded-lg border flex items-start gap-2 ${
                    theme === 'dark'
                      ? 'bg-red-950/30 border-red-800/40 text-red-200'
                      : 'bg-red-50 border-red-100 text-red-900'
                  }`}
                >
                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[11px]">Substation A: Load Surge +33%</div>
                    <div className="text-[10px] opacity-85">Thermal headroom exceeded nominal buffer.</div>
                  </div>
                </div>
                <div
                  className={`p-2 rounded-lg border flex items-start gap-2 ${
                    theme === 'dark'
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-900'
                  }`}
                >
                  <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[11px]">Reroute Policy Verified</div>
                    <div className="text-[10px] opacity-85">10/10 Monte Carlo verification passes.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setActiveRoute('settings')}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'text-zinc-400 hover:text-white hover:bg-white/10'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title="Engine Settings & Parameters"
        >
          <Settings size={16} />
        </button>

        {/* User Profile Avatar with Online Indicator */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center gap-1.5 p-0.5 rounded-xl transition-colors cursor-pointer ${
              theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'
            }`}
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-700 to-black text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-red-500/40">
                SP
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-black" />
            </div>
          </button>

          {showProfileMenu && (
            <div
              className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-xl p-2 z-50 border ${
                theme === 'dark'
                  ? 'bg-[#101117] border-white/15 text-white'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div
                className={`px-3 py-2 border-b ${
                  theme === 'dark' ? 'border-white/10' : 'border-slate-100'
                }`}
              >
                <div className="font-bold text-xs">Operator Terminal #4</div>
                <div className="text-[10px] text-red-400 font-medium">Grid Sentinel Dispatcher</div>
              </div>
              <div className="py-1 text-xs">
                <button
                  onClick={() => {
                    setActiveRoute('scenarios');
                    setShowProfileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    theme === 'dark' ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Switch Scenario
                </button>
                <button
                  onClick={() => {
                    setActiveRoute('benchmarks');
                    setShowProfileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    theme === 'dark' ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Benchmark Suite
                </button>
              </div>
            </div>
          )}
        </div>

        {/* "+ Add Widget" Primary Button */}
        <button
          onClick={() => setIsAddWidgetModalOpen(true)}
          className="flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-red-600/30 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Add Widget</span>
        </button>
      </div>
    </header>
  );
};
