'use client';

/**
 * Skeleton placeholder components for the dashboard loading state.
 *
 * Each skeleton matches the exact layout dimensions of its loaded
 * counterpart to prevent layout shift (CLS = 0).
 *
 * @module DashboardSkeleton
 */

import { cn } from '@/shared/utils/cn';

interface PulseBlockProps {
  className?: string;
}

function PulseBlock({ className }: PulseBlockProps) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} />;
}

/**
 * Skeleton for FootprintScoreCard.
 * Matches the card height and internal text layout.
 */
function ScoreCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <PulseBlock className="mb-4 h-4 w-32" />
      <PulseBlock className="mb-3 h-16 w-48" />
      <PulseBlock className="mb-2 h-3 w-64" />
      <PulseBlock className="h-3 w-56" />
    </div>
  );
}

/**
 * Skeleton for CategoryBreakdown (radar chart).
 * Renders a circular placeholder matching the chart's aspect ratio.
 */
function CategoryChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <PulseBlock className="mb-4 h-4 w-40" />
      <div className="flex items-center justify-center">
        <PulseBlock className="h-[300px] w-[300px] rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for TrendChart (line chart).
 * Renders a rectangular placeholder matching the chart container.
 */
function TrendChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <PulseBlock className="mb-4 h-4 w-36" />
      <PulseBlock className="h-[300px] w-full" />
    </div>
  );
}

/**
 * Full dashboard skeleton matching the loaded layout grid.
 *
 * Applies `aria-busy` and `aria-label` for screen readers so
 * assistive technology announces the loading state.
 */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="space-y-6">
      <ScoreCardSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryChartSkeleton />
        <TrendChartSkeleton />
      </div>
    </div>
  );
}

export { ScoreCardSkeleton, CategoryChartSkeleton, TrendChartSkeleton };
