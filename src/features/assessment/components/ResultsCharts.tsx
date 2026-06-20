'use client';

import { memo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { FootprintBreakdown } from '@/features/assessment/types/assessment.types';

interface ResultsChartsProps {
  breakdown: FootprintBreakdown;
}

const COLORS = [
  'hsl(217, 91%, 60%)', // Transport: Blue
  'hsl(45, 93%, 47%)', // Energy: Warm Gold
  'hsl(142, 72%, 29%)', // Diet: Forest Green
  'hsl(271, 91%, 65%)', // Shopping: Vibrant Purple
  'hsl(175, 77%, 40%)', // Travel: Sleek Teal
];

export const ResultsCharts = memo(function ResultsCharts({ breakdown }: ResultsChartsProps) {
  const data = [
    { name: 'Transport', value: breakdown.transport },
    { name: 'Energy', value: breakdown.energy },
    { name: 'Diet', value: breakdown.diet },
    { name: 'Shopping', value: breakdown.shopping },
    { name: 'Travel', value: breakdown.travel },
  ].filter((item) => item.value > 0);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number }>;
  }) => {
    if (active && payload && payload.length > 0) {
      const first = payload[0];
      if (first) {
        const value = first.value;
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
        return (
          <div className="rounded-lg border border-border bg-background/95 p-3 shadow-md backdrop-blur-sm">
            <p className="text-sm font-semibold text-foreground">{first.name}</p>
            <p className="text-xs font-bold text-primary">
              {value.toLocaleString()} kg CO₂/yr ({percentage}%)
            </p>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <figure
        role="img"
        aria-labelledby="chart-title-id"
        aria-describedby="chart-desc-id"
        className="relative w-full rounded-xl border border-border bg-card p-4 shadow-sm"
      >
        <figcaption id="chart-title-id" className="mb-4 text-base font-semibold text-foreground">
          Carbon Footprint Breakdown
        </figcaption>
        {/* Screen Reader accessible descriptors */}
        <div id="chart-desc-id" className="sr-only">
          A visual breakdown of your annual carbon emissions. Transport accounts for{' '}
          {breakdown.transport} kg, Home Energy for {breakdown.energy} kg, Diet for {breakdown.diet}{' '}
          kg, Shopping for {breakdown.shopping} kg, and Travel for {breakdown.travel} kg. Total is{' '}
          {breakdown.total} kg.
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </figure>

      {/* Visually Hidden Screen Reader Table (satisfies keyboard/screen-reader accessibility) */}
      <div className="sr-only">
        <h4>Emissions Data Table</h4>
        <table>
          <thead>
            <tr>
              <th scope="col">Emissions Category</th>
              <th scope="col">Annual CO₂ (kg)</th>
              <th scope="col">Percentage (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Transport</td>
              <td>{breakdown.transport.toLocaleString()} kg</td>
              <td>{total > 0 ? ((breakdown.transport / total) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td>Energy</td>
              <td>{breakdown.energy.toLocaleString()} kg</td>
              <td>{total > 0 ? ((breakdown.energy / total) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td>Diet</td>
              <td>{breakdown.diet.toLocaleString()} kg</td>
              <td>{total > 0 ? ((breakdown.diet / total) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td>Shopping</td>
              <td>{breakdown.shopping.toLocaleString()} kg</td>
              <td>{total > 0 ? ((breakdown.shopping / total) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td>Travel</td>
              <td>{breakdown.travel.toLocaleString()} kg</td>
              <td>{total > 0 ? ((breakdown.travel / total) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <th scope="row">Total</th>
              <td>
                <strong>{breakdown.total.toLocaleString()} kg</strong>
              </td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});
