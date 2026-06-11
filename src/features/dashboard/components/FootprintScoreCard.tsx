'use client';

/**
 * FootprintScoreCard — hero metric display for the dashboard.
 *
 * Shows the user's total annual carbon footprint with colour-coded
 * severity and comparison metrics against global and national averages.
 *
 * WHY React.memo: This component receives primitives that rarely change
 * between renders. Memoising prevents re-render when sibling chart
 * components update or the parent re-renders for unrelated reasons.
 *
 * @module FootprintScoreCard
 */

import { memo, useMemo } from 'react';
import { cn } from '@/shared/utils/cn';
import type { ScoreTier } from '@/features/dashboard/types/dashboard.types';

interface FootprintScoreCardProps {
  /** Total annual CO2 emissions in kg. */
  readonly totalKg: number;
  /** Ratio vs global average (< 1 = below, > 1 = above). */
  readonly comparedToAverage: number;
  /** Percentile ranking 0–100. */
  readonly percentile: number;
}

/** Global average annual CO2 in kg (≈ 4.7 tonnes). */
const GLOBAL_AVERAGE_KG = 4_700;
/** UK national average annual CO2 in kg (≈ 5.5 tonnes). */
const NATIONAL_AVERAGE_KG = 5_500;

/**
 * Determines the colour tier based on annual emissions.
 * - Green: < 7,000 kg (< 7t)
 * - Yellow: 7,000–14,000 kg (7–14t)
 * - Red: > 14,000 kg (> 14t)
 */
function getScoreTier(totalKg: number): ScoreTier {
  if (totalKg < 7_000) return 'green';
  if (totalKg < 14_000) return 'yellow';
  return 'red';
}

const TIER_STYLES: Record<ScoreTier, { card: string; badge: string; label: string }> = {
  green: {
    card: 'border-emerald-500/30 bg-emerald-500/5',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    label: 'Low Impact',
  },
  yellow: {
    card: 'border-amber-500/30 bg-amber-500/5',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    label: 'Moderate Impact',
  },
  red: {
    card: 'border-red-500/30 bg-red-500/5',
    badge: 'bg-red-500/15 text-red-700 dark:text-red-400',
    label: 'High Impact',
  },
};

function formatTonnes(kg: number): string {
  return (kg / 1_000).toFixed(1);
}

function getComparisonText(totalKg: number, baseline: number, label: string): string {
  const diff = ((totalKg - baseline) / baseline) * 100;
  const absDiff = Math.abs(Math.round(diff));
  return diff < 0
    ? `${absDiff}% below ${label}`
    : diff > 0
      ? `${absDiff}% above ${label}`
      : `Equal to ${label}`;
}

function FootprintScoreCardInner({
  totalKg,
  comparedToAverage,
  percentile,
}: FootprintScoreCardProps) {
  /**
   * WHY useMemo: The tier and comparison strings are derived from
   * primitive props. Memoising avoids recomputation on every render
   * when the parent re-renders but these props haven't changed
   * (e.g. during React Query background refetch indicator updates).
   */
  const tier = useMemo(() => getScoreTier(totalKg), [totalKg]);
  const styles = TIER_STYLES[tier];
  const globalComparison = useMemo(
    () => getComparisonText(totalKg, GLOBAL_AVERAGE_KG, 'global average'),
    [totalKg],
  );
  const nationalComparison = useMemo(
    () => getComparisonText(totalKg, NATIONAL_AVERAGE_KG, 'national average'),
    [totalKg],
  );

  const ariaLabel = `Your carbon footprint: ${formatTonnes(totalKg)} tonnes CO2 per year, ${
    comparedToAverage < 1
      ? `${Math.round((1 - comparedToAverage) * 100)}% below`
      : `${Math.round((comparedToAverage - 1) * 100)}% above`
  } global average`;

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn('rounded-xl border p-6 transition-colors', styles.card)}
    >
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Annual Carbon Footprint
        </h2>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
            styles.badge,
          )}
        >
          {styles.label}
        </span>
      </div>

      <p className="mb-4 text-5xl font-bold tracking-tight text-foreground">
        {formatTonnes(totalKg)}
        <span className="ml-2 text-lg font-normal text-muted-foreground">
          tonnes CO₂/yr
        </span>
      </p>

      <div className="space-y-1 text-sm text-muted-foreground">
        <p>{globalComparison}</p>
        <p>{nationalComparison}</p>
        <p>
          Percentile ranking:{' '}
          <span className="font-medium text-foreground">{percentile}</span>
          <span className="text-xs">/100</span>
        </p>
      </div>
    </div>
  );
}

export const FootprintScoreCard = memo(FootprintScoreCardInner);
FootprintScoreCard.displayName = 'FootprintScoreCard';
