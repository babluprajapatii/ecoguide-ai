'use client';

/**
 * CategoryBreakdown — radar chart of per-category carbon emissions.
 *
 * Renders a Recharts RadarChart showing transport, diet, energy,
 * and shopping contributions. The chart is wrapped with `role="img"`
 * and a descriptive `aria-label` for screen readers.
 *
 * WHY React.memo: Chart rendering is expensive (SVG DOM reconciliation).
 * The input data only changes on new assessments, so memoising avoids
 * re-drawing the chart when the parent re-renders for other reasons
 * (e.g. hover states on the score card, React Query status flips).
 *
 * This component is dynamically imported (next/dynamic) from the
 * dashboard page to code-split Recharts out of the initial JS bundle.
 *
 * @module CategoryBreakdown
 */

import { memo, useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CategoryDataPoint } from '@/features/dashboard/types/dashboard.types';

interface CategoryBreakdownProps {
  /** Transport emissions in kg CO2/yr. */
  readonly transportKg: number;
  /** Diet emissions in kg CO2/yr. */
  readonly dietKg: number;
  /** Energy emissions in kg CO2/yr. */
  readonly energyKg: number;
  /** Shopping emissions in kg CO2/yr. */
  readonly shoppingKg: number;
}

/**
 * Builds radar chart data from raw category values.
 *
 * `fullMark` is set to the max category value (or a minimum of 1000)
 * so the radar fills proportionally.
 */
function buildChartData(
  transportKg: number,
  dietKg: number,
  energyKg: number,
  shoppingKg: number,
): CategoryDataPoint[] {
  const maxValue = Math.max(transportKg, dietKg, energyKg, shoppingKg, 1000);
  return [
    { category: 'Transport', value: transportKg, fullMark: maxValue },
    { category: 'Diet', value: dietKg, fullMark: maxValue },
    { category: 'Energy', value: energyKg, fullMark: maxValue },
    { category: 'Shopping', value: shoppingKg, fullMark: maxValue },
  ];
}

function formatKg(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}t`;
  }
  return `${Math.round(value)} kg`;
}

function CategoryBreakdownInner({
  transportKg,
  dietKg,
  energyKg,
  shoppingKg,
}: CategoryBreakdownProps) {
  /**
   * WHY useMemo: buildChartData allocates a new array on every call.
   * Memoising on the four numeric dependencies avoids creating new
   * referentially-different data arrays that would force Recharts
   * to re-render its SVG tree.
   */
  const chartData = useMemo(
    () => buildChartData(transportKg, dietKg, energyKg, shoppingKg),
    [transportKg, dietKg, energyKg, shoppingKg],
  );

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        Category Breakdown
      </h3>
      <div
        role="img"
        aria-label="Radar chart showing carbon breakdown by category"
      >
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 'dataMax']}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="CO₂ Emissions"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(value: unknown) => {
                const numValue = typeof value === 'number' ? value : Number(value);
                return [formatKg(isNaN(numValue) ? 0 : numValue), 'CO₂/yr'];
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {chartData.map((point) => (
          <div key={point.category} className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">{point.category}</span>
            <span className="ml-auto font-medium text-foreground">
              {formatKg(point.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(CategoryBreakdownInner);
