'use client';

/**
 * TrendChart — historical line chart of carbon footprint over time.
 *
 * Renders a Recharts LineChart with assessment totals plotted
 * chronologically. Wrapped with `role="img"` and `aria-label`
 * for accessibility.
 *
 * WHY React.memo: Like CategoryBreakdown, chart rendering involves
 * expensive SVG reconciliation. The history array only changes when
 * a new assessment is submitted, so memoising prevents redundant
 * re-draws when the parent component re-renders (e.g. during React
 * Query background refetch indicator toggling).
 *
 * Designed for dynamic import (next/dynamic) to code-split Recharts.
 *
 * @module TrendChart
 */

import { memo, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AssessmentRecord, TrendDataPoint } from '@/features/dashboard/types/dashboard.types';

interface TrendChartProps {
  /** Historical assessments ordered oldest-first. */
  readonly history: readonly AssessmentRecord[];
}

/**
 * Transforms raw assessment records into chart-friendly data points.
 *
 * @param history - Assessment records ordered by date ascending.
 * @returns Array of `TrendDataPoint` for the LineChart.
 */
function buildTrendData(history: readonly AssessmentRecord[]): TrendDataPoint[] {
  return history.map((record) => {
    const date = new Date(record.created_at);
    return {
      date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      total: Math.round(record.total_kg / 10) / 100, // Convert to tonnes, 2dp
      fullDate: record.created_at,
    };
  });
}

function TrendChartInner({ history }: TrendChartProps) {
  /**
   * WHY useMemo: buildTrendData maps over the history array and creates
   * new Date objects. Memoising on the `history` reference avoids this
   * work when the parent re-renders but the history data hasn't changed.
   */
  const chartData = useMemo(() => buildTrendData(history), [history]);

  if (chartData.length < 2) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">
          Footprint Trend
        </h3>
        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          <p>Complete at least 2 assessments to see your trend.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        Footprint Trend
      </h3>
      <div
        role="img"
        aria-label={`Line chart showing carbon footprint trend over ${chartData.length} assessments`}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${value}t`}
              width={45}
            />
            <Tooltip
              formatter={(value: unknown) => {
                const numValue = typeof value === 'number' ? value : Number(value);
                return [`${isNaN(numValue) ? 0 : numValue}t CO₂`, 'Total'];
              }}
              labelFormatter={(label: unknown) => String(label ?? '')}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default memo(TrendChartInner);
