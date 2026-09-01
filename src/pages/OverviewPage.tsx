import React from 'react';
import { SubHeader } from '../components/layout/SubHeader';
import { NetworkCard } from '../components/overview/NetworkCard';
import { RiskPredictionCard } from '../components/overview/RiskPredictionCard';
import { EventDetailsCard } from '../components/overview/EventDetailsCard';
import { InterventionCompareCard } from '../components/overview/InterventionCompareCard';
import { RecommendedActionCard } from '../components/overview/RecommendedActionCard';
import { RevenuePerformanceCard } from '../components/overview/RevenuePerformanceCard';
import { ContainmentOverviewCard } from '../components/overview/ContainmentOverviewCard';
import { GlobalMapViewCard } from '../components/overview/GlobalMapViewCard';
import { ImpactSummaryCard } from '../components/overview/ImpactSummaryCard';
import { TimeToFailureCard } from '../components/overview/TimeToFailureCard';
import { DataQualityCard } from '../components/overview/DataQualityCard';
import { PatternBannerCard } from '../components/overview/PatternBannerCard';

export const OverviewPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* SubHeader with Active Event & Scenario */}
      <SubHeader title="Overview Dashboard" />

      {/* Main Dashboard Content Grid */}
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* ROW 1: Infrastructure Network (50%), Risk Prediction (25%), Event Details (25%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <NetworkCard />
          </div>
          <div className="lg:col-span-3">
            <RiskPredictionCard />
          </div>
          <div className="lg:col-span-3">
            <EventDetailsCard />
          </div>
        </div>

        {/* ROW 2: Intervention Simulation (9 cols) + Recommended Action (3 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9">
            <InterventionCompareCard />
          </div>
          <div className="lg:col-span-3">
            <RecommendedActionCard />
          </div>
        </div>

        {/* ROW 3: Revenue Performance (4 cols), Containment Overview (4 cols), Global Map View (4 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <RevenuePerformanceCard />
          </div>
          <div className="lg:col-span-4">
            <ContainmentOverviewCard />
          </div>
          <div className="lg:col-span-4">
            <GlobalMapViewCard />
          </div>
        </div>

        {/* ROW 4: Impact Summary (4 cols), Time to Failure (3 cols), Data Quality (2 cols), Pattern Banner (3 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <ImpactSummaryCard />
          </div>
          <div className="lg:col-span-3">
            <TimeToFailureCard />
          </div>
          <div className="lg:col-span-2">
            <DataQualityCard />
          </div>
          <div className="lg:col-span-3">
            <PatternBannerCard />
          </div>
        </div>
      </div>
    </div>
  );
};
