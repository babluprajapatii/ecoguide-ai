'use client';

/**
 * DashboardClient — client-side orchestrator for the dashboard UI.
 *
 * Accepts server-fetched initial data as props to avoid a loading
 * waterfall, then hydrates into React Query for caching and
 * background refetching.
 *
 * Lazily loads chart components via `next/dynamic` to keep the
 * initial JS bundle small (Recharts is ~140 KB gzipped).
 *
 * @module DashboardClient
 */

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { FootprintScoreCard } from '@/features/dashboard/components/FootprintScoreCard';
import { DashboardSkeleton, CategoryChartSkeleton, TrendChartSkeleton } from '@/features/dashboard/components/DashboardSkeleton';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import type { DashboardData } from '@/features/dashboard/types/dashboard.types';

/**
 * Lazily load CategoryBreakdown — code-splits Recharts out of the
 * initial page bundle. Shows a matching skeleton while loading.
 */
const CategoryBreakdown = dynamic(
  () => import('@/features/dashboard/components/CategoryBreakdown'),
  {
    loading: () => <CategoryChartSkeleton />,
    ssr: false,
  },
);

/**
 * Lazily load TrendChart with the same pattern.
 */
const TrendChart = dynamic(
  () => import('@/features/dashboard/components/TrendChart'),
  {
    loading: () => <TrendChartSkeleton />,
    ssr: false,
  },
);

interface DashboardClientProps {
  /** Server-side pre-fetched data passed from the Server Component. */
  readonly initialData: DashboardData;
}

/**
 * Client-side dashboard shell.
 *
 * Hydrates server data into React Query, renders the score card
 * and lazily-loaded chart components. Handles empty state when
 * no assessments exist.
 */
export function DashboardClient({ initialData }: DashboardClientProps) {
  const { data, isLoading, error } = useDashboardData(initialData);

  /**
   * WHY useMemo: Deriving the display data from the query result.
   * Stabilises the reference so memoised child components don't
   * re-render when React Query flips its internal flags (isFetching,
   * isStale) without the actual data changing.
   */
  const displayData = useMemo(() => data ?? initialData, [data, initialData]);

  if (isLoading && !displayData.latestAssessment) {
    return <DashboardSkeleton />;
  }

  if (error && !displayData.latestAssessment) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6" role="alert">
        <h2 className="text-lg font-semibold text-foreground">Failed to load dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const { latestAssessment, history } = displayData;

  if (!latestAssessment) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
            aria-hidden="true"
          >
            <path d="M12 2v4" />
            <path d="m16.2 7.8 2.9-2.9" />
            <path d="M18 12h4" />
            <path d="m16.2 16.2 2.9 2.9" />
            <path d="M12 18v4" />
            <path d="m4.9 19.1 2.9-2.9" />
            <path d="M2 12h4" />
            <path d="m4.9 4.9 2.9 2.9" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground">No assessments yet</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Complete your first carbon footprint assessment to see your dashboard with
          personalised insights and visualisations.
        </p>
        <a
          href="/assessment"
          className="mt-6 inline-flex rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Take Assessment
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FootprintScoreCard
        totalKg={latestAssessment.total_kg}
        comparedToAverage={latestAssessment.compared_to_average}
        percentile={latestAssessment.percentile}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryBreakdown
          transportKg={latestAssessment.transport_kg}
          dietKg={latestAssessment.diet_kg}
          energyKg={latestAssessment.energy_kg}
          shoppingKg={latestAssessment.shopping_kg}
        />
        <TrendChart history={history} />
      </div>
    </div>
  );
}
