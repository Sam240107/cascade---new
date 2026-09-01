import React from 'react';
import { useApp, AppRoute } from '../../state/AppContext';
import { CascadeLogo } from '../common/CascadeLogo';
import { SidebarSpiderIllustration } from '../common/SidebarSpiderIllustration';
import {
  Home,
  Target,
  Zap,
  FlaskConical,
  Compass,
  ShieldCheck,
  BarChart3,
  LayoutGrid,
  Activity,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface NavItem {
  id: AppRoute;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'events', label: 'Event & Correlation', icon: Target },
  { id: 'risk', label: 'Risk Prediction', icon: Zap },
  { id: 'simulation', label: 'Intervention Simulation', icon: FlaskConical },
  { id: 'recommendation', label: 'Recommended Action', icon: Compass },
  { id: 'verification', label: 'Verification', icon: ShieldCheck },
  { id: 'impact', label: 'Impact Analysis', icon: BarChart3 },
];

const secondaryNavItems: NavItem[] = [
  { id: 'scenarios', label: 'Scenarios', icon: LayoutGrid },
  { id: 'benchmarks', label: 'Benchmark Results', icon: Activity },
  { id: 'settings', label: 'Settings & Parameters', icon: Sliders },
];

export const Sidebar: React.FC = () => {
  const { activeRoute, setActiveRoute, isSidebarCollapsed, setIsSidebarCollapsed, theme } = useApp();

  return (
    <aside
      className={`fixed inset-y-0 left-0 h-screen z-30 flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none transition-all duration-300 border-r ${
        theme === 'dark'
          ? 'bg-[#08080d] border-white/10 text-white shadow-2xl'
          : 'bg-white border-slate-200 text-slate-800 shadow-xs'
      } ${isSidebarCollapsed ? 'w-[68px]' : 'w-[230px]'}`}
    >
      {/* Top Section: Brand Logo & Navigation */}
      <div className={`${isSidebarCollapsed ? 'p-2' : 'p-3'} pb-1 flex flex-col`}>
        {/* Brand Header with Close/Toggle Button */}
        <div
          className={`flex items-center justify-between pb-2.5 border-b ${
            theme === 'dark' ? 'border-white/10' : 'border-slate-100'
          }`}
        >
          <div
            onClick={() => setActiveRoute('overview')}
            className="cursor-pointer"
            title="CASCADE Dashboard"
          >
            <CascadeLogo size={34} showText={!isSidebarCollapsed} collapsed={isSidebarCollapsed} />
          </div>

          {/* Sidebar Collapse Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-1 rounded-lg transition-colors shrink-0 ${
              theme === 'dark'
                ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Close / Collapse Sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* Compact Primary Navigation List */}
        <nav className="mt-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveRoute(item.id)}
                title={item.label}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                } py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 relative group cursor-pointer ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-red-950/40 text-red-400 font-bold border border-red-500/30'
                      : 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-1 bg-red-600 rounded-r shadow-xs shadow-red-500" />
                )}
                <Icon
                  size={15}
                  className={`shrink-0 ${
                    isActive
                      ? 'text-red-500'
                      : theme === 'dark'
                      ? 'text-zinc-500 group-hover:text-zinc-300'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                {!isSidebarCollapsed && (
                  <span className="ml-2.5 truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div
          className={`my-2 border-t ${
            theme === 'dark' ? 'border-white/10' : 'border-slate-100'
          }`}
        />

        {/* Secondary Navigation (Scenarios, Benchmarks, Settings) */}
        <nav className="space-y-0.5">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveRoute(item.id)}
                title={item.label}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-1.5' : 'px-2.5'
                } py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 relative group cursor-pointer ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-red-950/40 text-red-400 font-bold border border-red-500/30'
                      : 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-1 bg-red-600 rounded-r shadow-xs shadow-red-500" />
                )}
                <Icon
                  size={15}
                  className={`shrink-0 ${
                    isActive
                      ? 'text-red-500'
                      : theme === 'dark'
                      ? 'text-zinc-500 group-hover:text-zinc-300'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                {!isSidebarCollapsed && (
                  <span className="ml-2.5 truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Spider-Man Artwork at bottom of sidebar */}
      {!isSidebarCollapsed && <SidebarSpiderIllustration />}
    </aside>
  );
};
