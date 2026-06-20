'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import type { DashboardData } from '@/features/dashboard/types/dashboard.types';

// Skeletons
import { DashboardSkeleton } from '@/features/dashboard/components/DashboardSkeleton';

// Dashboard Onboarding Empty State
import { DashboardOnboarding } from '@/features/dashboard/components/DashboardOnboarding';

// Summary KPI cards
import { SummaryCards } from '@/features/dashboard/components/SummaryCards';

// Analytics Services
import { calculateReductionPotential } from '../services/analytics.service';

// Custom Widgets
import { InsightsPanel } from '@/features/dashboard/components/InsightsPanel';
import { GoalsWidget } from '@/features/dashboard/components/GoalsWidget';
import { AchievementsPreview } from '@/features/dashboard/components/AchievementsPreview';
import { CommunityPreview } from '@/features/dashboard/components/CommunityPreview';

/**
 * Lazily load AnalyticsCharts to optimize bundle sizes and code-split Recharts.
 */
const AnalyticsCharts = dynamic(
  () =>
    import('@/features/dashboard/components/AnalyticsCharts').then((mod) => mod.AnalyticsCharts),
  {
    loading: () => (
      <div className="h-[380px] animate-pulse rounded-2xl border border-border/80 bg-muted/20" />
    ),
    ssr: false,
  },
);

interface DashboardClientProps {
  /** Server-side pre-fetched data passed from the Server Component. */
  readonly initialData: DashboardData;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const { data, isLoading, error } = useDashboardData(initialData);

  const displayData = useMemo(() => data ?? initialData, [data, initialData]);

  const latestAssessment = displayData.latestAssessment;
  const history = displayData.history;

  // Memoize potential savings calculations to avoid unnecessary recalculations
  const savings = useMemo(() => {
    if (!latestAssessment) return { targetTotal: 0, savingsTotal: 0 };
    return calculateReductionPotential({
      transport_kg: latestAssessment.transport_kg,
      diet_kg: latestAssessment.diet_kg,
      energy_kg: latestAssessment.energy_kg,
      shopping_kg: latestAssessment.shopping_kg,
      travel_kg: latestAssessment.travel_kg,
    });
  }, [latestAssessment]);

  if (isLoading && !latestAssessment) {
    return <DashboardSkeleton />;
  }

  if (error && !latestAssessment) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6" role="alert">
        <h2 className="text-lg font-semibold text-foreground">Failed to load dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  // Onboarding empty-state check (no assessments exist)
  if (!latestAssessment) {
    return <DashboardOnboarding />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards section */}
      <SummaryCards
        latestAssessment={latestAssessment}
        savingsTotal={savings.savingsTotal}
        history={history}
      />

      {/* Grid containing charts, insights, goals, achievements, and community leaderboard preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 columns: Charts, Goals, and Insights */}
        <div className="space-y-6 lg:col-span-2">
          <AnalyticsCharts
            latestAssessment={latestAssessment}
            history={history}
            targetTotal={savings.targetTotal}
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <InsightsPanel latestAssessment={latestAssessment} />
            <GoalsWidget />
          </div>
        </div>

        {/* Right column: Level Progress & Badges, Leaderboard standings */}
        <div className="space-y-6">
          <AchievementsPreview />
          <CommunityPreview />
        </div>
      </div>
    </div>
  );
}
