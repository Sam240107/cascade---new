/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { WhyActionModal } from './components/modals/WhyActionModal';
import { AddWidgetModal } from './components/modals/AddWidgetModal';

import { OverviewPage } from './pages/OverviewPage';
import { EventsPage } from './pages/EventsPage';
import { RiskPage } from './pages/RiskPage';
import { SimulationPage } from './pages/SimulationPage';
import { RecommendationPage } from './pages/RecommendationPage';
import { VerificationPage } from './pages/VerificationPage';
import { ImpactPage } from './pages/ImpactPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { BenchmarksPage } from './pages/BenchmarksPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { activeRoute, isSidebarCollapsed, theme } = useApp();

  const renderActivePage = () => {
    switch (activeRoute) {
      case 'overview':
        return <OverviewPage />;
      case 'events':
        return <EventsPage />;
      case 'risk':
        return <RiskPage />;
      case 'simulation':
        return <SimulationPage />;
      case 'recommendation':
        return <RecommendationPage />;
      case 'verification':
        return <VerificationPage />;
      case 'impact':
        return <ImpactPage />;
      case 'scenarios':
        return <ScenariosPage />;
      case 'benchmarks':
        return <BenchmarksPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div
      className={`min-h-screen font-sans antialiased selection:bg-red-600 selection:text-white transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-[#050508] text-white'
          : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Fixed Left Sidebar (230px or 68px collapsed) */}
      <Sidebar />

      {/* Main Application Area (Dynamic margin based on sidebar state) */}
      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          theme === 'dark' ? 'bg-[#050508]' : 'bg-[#f8fafc]'
        } ${isSidebarCollapsed ? 'ml-[68px]' : 'ml-[230px]'}`}
      >
        {/* Sticky Top Header with Theme Toggle */}
        <Header />

        {/* Scrollable Main Content Story */}
        <main className="flex-1 w-full">{renderActivePage()}</main>

        {/* Persistent Bottom Real-time Engine Status Bar */}
        <StatusBar />
      </div>

      {/* Modals */}
      <WhyActionModal />
      <AddWidgetModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
