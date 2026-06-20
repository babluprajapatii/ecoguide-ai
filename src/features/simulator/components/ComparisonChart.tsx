'use client';

import React, { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { SavedSimulation } from '../hooks/useSimulatorDashboard';

interface ComparisonChartProps {
  readonly selectedSimulations: SavedSimulation[];
}

function ComparisonChartComponent({ selectedSimulations }: ComparisonChartProps) {
  const data = selectedSimulations.map((sim) => ({
    name: sim.scenario_name,
    'Carbon Savings (t/yr)': Number((sim.estimated_carbon_savings / 1000).toFixed(2)),
    'Cost Savings ($/yr)': Number(sim.estimated_cost_savings.toFixed(0)),
    'Impact Score': sim.impact_score,
  }));

  return (
    <figure className="space-y-4">
      <figcaption className="sr-only">Scenario Comparison Chart</figcaption>
      {/* Visual Chart */}
      <div
        role="img"
        aria-label="Bar chart comparing carbon savings, cost savings, and impact score of selected scenarios side by side"
        className="h-[350px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
            <XAxis
              dataKey="name"
              stroke="currentColor"
              className="text-[10px] text-muted-foreground"
            />
            <YAxis
              yAxisId="left"
              stroke="#10b981"
              className="text-[10px]"
              label={{
                value: 'Savings (t / $)',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: '#10b981',
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#f59e0b"
              className="text-[10px]"
              label={{
                value: 'Impact Score',
                angle: 90,
                position: 'insideRight',
                offset: 10,
                fill: '#f59e0b',
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar
              yAxisId="left"
              dataKey="Carbon Savings (t/yr)"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Carbon Savings (t)"
            />
            <Bar
              yAxisId="left"
              dataKey="Cost Savings ($/yr)"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Cost Savings ($)"
            />
            <Bar
              yAxisId="right"
              dataKey="Impact Score"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              name="Impact Score"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Screen Reader Table Fallback */}
      <div className="sr-only">
        <h4>Scenario Comparison Data Table</h4>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th scope="col" className="border-b border-border p-2">
                Scenario Name
              </th>
              <th scope="col" className="border-b border-border p-2">
                Carbon Savings
              </th>
              <th scope="col" className="border-b border-border p-2">
                Cost Savings
              </th>
              <th scope="col" className="border-b border-border p-2">
                Impact Score
              </th>
            </tr>
          </thead>
          <tbody>
            {selectedSimulations.map((sim) => (
              <tr key={sim.id}>
                <td className="border-b border-border p-2">{sim.scenario_name}</td>
                <td className="border-b border-border p-2">
                  {(sim.estimated_carbon_savings / 1000).toFixed(2)} tonnes CO₂/yr
                </td>
                <td className="border-b border-border p-2">
                  ${sim.estimated_cost_savings.toFixed(0)}/yr
                </td>
                <td className="border-b border-border p-2">{sim.impact_score}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export default memo(ComparisonChartComponent);
