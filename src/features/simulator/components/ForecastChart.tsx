'use client';

/**
 * ForecastChart — Recharts AreaChart showing 12-month emission forecast.
 *
 * Lazy-loaded and wrapped in React.memo to avoid re-renders when
 * props haven't changed.
 *
 * @module ForecastChart
 */

import React, { memo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MonthlyProjection } from '@/features/simulator/types/simulator.types';

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs text-muted-foreground">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: <span className="font-semibold text-foreground">{(entry.value / 1000).toFixed(1)}t</span>
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart colors
// ---------------------------------------------------------------------------

const COLORS = {
  transport: '#f59e0b', // amber
  diet: '#22c55e',      // green
  energy: '#3b82f6',    // blue
  shopping: '#a855f7',  // purple
  total: '#10b981',     // emerald
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ForecastChartProps {
  readonly forecast: MonthlyProjection[];
}

function ForecastChartComponent({ forecast }: ForecastChartProps) {
  return (
    <div
      role="img"
      aria-label="Area chart showing projected carbon footprint forecast over 12 months by category"
      className="h-[400px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={forecast}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="gradTransport" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.transport} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.transport} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDiet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.diet} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.diet} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradEnergy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.energy} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.energy} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradShopping" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.shopping} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.shopping} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
          />
          <YAxis
            tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}t`}
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          />
          <Area
            type="monotone"
            dataKey="transport"
            name="Transport"
            stroke={COLORS.transport}
            fill="url(#gradTransport)"
            strokeWidth={2}
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="diet"
            name="Diet"
            stroke={COLORS.diet}
            fill="url(#gradDiet)"
            strokeWidth={2}
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="energy"
            name="Energy"
            stroke={COLORS.energy}
            fill="url(#gradEnergy)"
            strokeWidth={2}
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="shopping"
            name="Shopping"
            stroke={COLORS.shopping}
            fill="url(#gradShopping)"
            strokeWidth={2}
            stackId="1"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Screen Reader Table Fallback */}
      <div className="sr-only">
        <h4>Projected Footprint Forecast Table</h4>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th scope="col" className="p-2 border-b border-border">Month</th>
              <th scope="col" className="p-2 border-b border-border">Transport</th>
              <th scope="col" className="p-2 border-b border-border">Diet</th>
              <th scope="col" className="p-2 border-b border-border">Energy</th>
              <th scope="col" className="p-2 border-b border-border">Shopping</th>
              <th scope="col" className="p-2 border-b border-border">Total</th>
            </tr>
          </thead>
          <tbody>
            {forecast.map((pt) => (
              <tr key={pt.month}>
                <td className="p-2 border-b border-border">{pt.month}</td>
                <td className="p-2 border-b border-border">{(pt.transport / 1000).toFixed(2)}t</td>
                <td className="p-2 border-b border-border">{(pt.diet / 1000).toFixed(2)}t</td>
                <td className="p-2 border-b border-border">{(pt.energy / 1000).toFixed(2)}t</td>
                <td className="p-2 border-b border-border">{(pt.shopping / 1000).toFixed(2)}t</td>
                <td className="p-2 border-b border-border">{(pt.total / 1000).toFixed(2)}t</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(ForecastChartComponent);
