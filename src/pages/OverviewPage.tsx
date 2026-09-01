import React from 'react';
import { useApp } from '../state/AppContext';
import { SubHeader } from '../components/layout/SubHeader';
import { CaseContextCard } from '../components/overview/CaseContextCard';
import { CaseImpactCard } from '../components/overview/CaseImpactCard';
import { CaseVerificationCard } from '../components/overview/CaseVerificationCard';
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
  const { isCaseStudyMode } = useApp();

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* SubHeader with Active Event & Scenario */}
      <SubHeader title="Overview Dashboard" />

      {isCaseStudyMode ? (
        /*
         * CASE-STUDY MODE — simplified, decision-support-focused layout.
         * Only case-derived sections in the order the demo story follows:
         * A. Case Context -> B. Infrastructure Network (centerpiece) ->
         * C. Cascade Impact -> D. Recommended Action -> E. Second-Shock
         * Verification. None of the generic/legacy NOC widgets (revenue,
         * global map, pattern match, data-quality/dropout, time-to-failure
         * countdown) are rendered here — they remain available, unmodified,
         * for the normal synthetic-scenario layout below.
         */
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto w-full">
          {/* A. Case Context */}
          <CaseContextCard />

          {/* B. Infrastructure Network — the visual centerpiece. Full page
              width (instead of sharing a row with Risk/Event cards, as in
              normal mode below) is what actually gives it breathing room;
              NetworkCard's own canvas has an internal max-height, so forcing
              extra height on its wrapper only produces dead space, not a
              bigger graph. NetworkCard itself is unchanged. */}
          <NetworkCard />

          {/* C. Cascade Impact + D. Recommended Action */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CaseImpactCard />
            <RecommendedActionCard />
          </div>

          {/* E. Second-Shock Verification */}
          <CaseVerificationCard />
        </div>
      ) : (
        /* NORMAL SYNTHETIC-SCENARIO MODE — unchanged from before. */
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
      )}
    </div>
  );
};
