'use client';

import { useState, memo, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import type { AssessmentRecord } from '@/features/dashboard/types/dashboard.types';
import { generateForecastCurve } from '../services/analytics.service';
import { PieChart as PieIcon, BarChart3, TrendingUp, Sliders, Milestone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalyticsChartsProps {
  readonly latestAssessment: AssessmentRecord;
  readonly history: readonly AssessmentRecord[];
  readonly targetTotal: number;
}

const COLORS = [
  'hsl(217, 91%, 60%)', // Transport: Blue
  'hsl(142, 72%, 29%)', // Diet: Forest Green
  'hsl(45, 93%, 47%)', // Energy: Warm Gold
  'hsl(271, 91%, 65%)', // Shopping: Vibrant Purple
  'hsl(175, 77%, 40%)', // Travel: Sleek Teal
];

const GLOBAL_AVERAGES = {
  transport: 1800,
  diet: 2000,
  energy: 1500,
  shopping: 1000,
  travel: 800,
};

function formatKg(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}t`;
  }
  return `${Math.round(value)} kg`;
}

type TabType = 'breakdown' | 'comparison' | 'progress' | 'forecast' | 'scoreTrend';

export const AnalyticsCharts = memo(function AnalyticsCharts({
  latestAssessment,
  history,
  targetTotal,
}: AnalyticsChartsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('breakdown');

  // --- Chart 1: Breakdown Pie Data ---
  const pieData = useMemo(() => {
    return [
      { name: 'Transport', value: latestAssessment.transport_kg },
      { name: 'Diet', value: latestAssessment.diet_kg },
      { name: 'Energy', value: latestAssessment.energy_kg },
      { name: 'Shopping', value: latestAssessment.shopping_kg },
      { name: 'Travel', value: latestAssessment.travel_kg },
    ].filter((d) => d.value > 0);
  }, [
    latestAssessment.transport_kg,
    latestAssessment.diet_kg,
    latestAssessment.energy_kg,
    latestAssessment.shopping_kg,
    latestAssessment.travel_kg,
  ]);

  const pieTotal = useMemo(() => pieData.reduce((sum, item) => sum + item.value, 0), [pieData]);

  // --- Chart 2: Category Comparison Bar Data ---
  const barData = useMemo(() => {
    return [
      {
        name: 'Transport',
        User: latestAssessment.transport_kg,
        Average: GLOBAL_AVERAGES.transport,
      },
      { name: 'Diet', User: latestAssessment.diet_kg, Average: GLOBAL_AVERAGES.diet },
      { name: 'Energy', User: latestAssessment.energy_kg, Average: GLOBAL_AVERAGES.energy },
      { name: 'Shopping', User: latestAssessment.shopping_kg, Average: GLOBAL_AVERAGES.shopping },
      { name: 'Travel', User: latestAssessment.travel_kg, Average: GLOBAL_AVERAGES.travel },
    ];
  }, [
    latestAssessment.transport_kg,
    latestAssessment.diet_kg,
    latestAssessment.energy_kg,
    latestAssessment.shopping_kg,
    latestAssessment.travel_kg,
  ]);

  // --- Chart 3: Monthly Progress Trend Data ---
  const progressData = useMemo(() => {
    return history.map((record) => {
      const date = new Date(record.created_at);
      return {
        date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        total: Math.round(record.total_kg / 10) / 100, // Tonnes
        raw: record.created_at,
      };
    });
  }, [history]);

  // --- Chart 4: Carbon Reduction Forecast Data ---
  const forecastData = useMemo(() => {
    return generateForecastCurve(latestAssessment.total_kg, targetTotal, 12).map((pt) => ({
      ...pt,
      totalTonnes: Math.round(pt.total / 10) / 100,
    }));
  }, [latestAssessment.total_kg, targetTotal]);

  // --- Chart 5: Community Standing Percentile Trend Data ---
  const scoreTrendData = useMemo(() => {
    return history.map((record) => {
      const date = new Date(record.created_at);
      return {
        date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        percentile: record.percentile,
      };
    });
  }, [history]);

  // --- Custom Tooltips ---
  const CustomPieTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: readonly { payload: { name: string; value: number } }[];
  }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0]?.payload;
      if (data) {
        const pct = pieTotal > 0 ? ((data.value / pieTotal) * 100).toFixed(1) : '0';
        return (
          <div className="rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur-sm">
            <p className="text-xs font-bold text-foreground">{data.name}</p>
            <p className="text-[11px] font-extrabold text-emerald-500">
              {formatKg(data.value)} ({pct}%)
            </p>
          </div>
        );
      }
    }
    return null;
  };

  const CustomBarTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: readonly { payload: { name: string; User: number; Average: number } }[];
  }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0]?.payload;
      if (data) {
        return (
          <div className="space-y-1 rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur-sm">
            <p className="text-xs font-bold text-foreground">{data.name}</p>
            <p className="text-[11px] font-semibold text-emerald-500">
              Your emissions: {formatKg(data.User)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Global Average: {formatKg(data.Average)}
            </p>
          </div>
        );
      }
    }
    return null;
  };

  const CustomLineTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: readonly { payload: { date: string; total: number } }[];
  }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0]?.payload;
      if (data) {
        return (
          <div className="rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur-sm">
            <p className="text-[10px] font-semibold text-muted-foreground">{data.date}</p>
            <p className="mt-0.5 text-xs font-bold text-emerald-500">{data.total}t CO₂/yr</p>
          </div>
        );
      }
    }
    return null;
  };

  const CustomForecastTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: readonly { payload: { month: string; totalTonnes: number } }[];
  }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0]?.payload;
      if (data) {
        return (
          <div className="rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur-sm">
            <p className="text-[10px] font-semibold text-muted-foreground">{data.month}</p>
            <p className="mt-0.5 text-xs font-bold text-emerald-500">{data.totalTonnes}t CO₂/yr</p>
          </div>
        );
      }
    }
    return null;
  };

  const CustomScoreTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: readonly { payload: { date: string; percentile: number } }[];
  }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0]?.payload;
      if (data) {
        return (
          <div className="rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur-sm">
            <p className="text-[10px] font-semibold text-muted-foreground">{data.date}</p>
            <p className="mt-0.5 text-xs font-bold text-purple-500">
              {data.percentile}th Percentile
            </p>
          </div>
        );
      }
    }
    return null;
  };

  const tabs = [
    { id: 'breakdown', label: 'Breakdown', icon: PieIcon },
    { id: 'comparison', label: 'Comparison', icon: BarChart3 },
    { id: 'progress', label: 'History', icon: TrendingUp },
    { id: 'forecast', label: 'Forecast', icon: Sliders },
    { id: 'scoreTrend', label: 'Standing', icon: Milestone },
  ] as const;

  return (
    <div className="space-y-6 rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25">
      {/* Tabs list with full keyboard accessibility */}
      <div
        className="flex flex-wrap gap-2 border-b border-border/60 pb-3"
        role="tablist"
        aria-label="Analytics Charts"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold outline-none transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                  : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic chart render with animations */}
      <div className="relative h-[320px] w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="h-full w-full"
            role="tabpanel"
            id={`${activeTab}-panel`}
            aria-labelledby={`${activeTab}-tab`}
          >
            {activeTab === 'breakdown' && (
              <figure className="h-full w-full space-y-4">
                <figcaption className="sr-only">
                  Pie chart showing emissions breakdown by category
                </figcaption>
                <div
                  role="img"
                  aria-label="Pie chart showing emissions breakdown by category"
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Screen Reader Table Fallback */}
                <div className="sr-only">
                  <table>
                    <caption>Carbon Breakdown</caption>
                    <thead>
                      <tr>
                        <th scope="col">Category</th>
                        <th scope="col">Emissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pieData.map((d) => (
                        <tr key={d.name}>
                          <td>{d.name}</td>
                          <td>{formatKg(d.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </figure>
            )}

            {activeTab === 'comparison' && (
              <figure className="h-full w-full space-y-4">
                <figcaption className="sr-only">
                  Bar chart comparing your emissions to global averages by category
                </figcaption>
                <div
                  role="img"
                  aria-label="Bar chart comparing your emissions to global averages by category"
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fill: 'hsl(var(--muted-foreground))',
                          fontSize: 11,
                          fontWeight: '600',
                        }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          value >= 1000 ? `${(value / 1000).toFixed(0)}t` : `${value}`
                        }
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {value}
                          </span>
                        )}
                      />
                      <Bar dataKey="User" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Average" fill="hsl(var(--border))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Screen Reader Table Fallback */}
                <div className="sr-only">
                  <table>
                    <caption>Category Comparison</caption>
                    <thead>
                      <tr>
                        <th scope="col">Category</th>
                        <th scope="col">Your Emissions</th>
                        <th scope="col">Global Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {barData.map((d) => (
                        <tr key={d.name}>
                          <td>{d.name}</td>
                          <td>{formatKg(d.User)}</td>
                          <td>{formatKg(d.Average)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </figure>
            )}

            {activeTab === 'progress' && (
              <figure className="h-full w-full space-y-4">
                <figcaption className="sr-only">
                  Line chart displaying history of total carbon emissions
                </figcaption>
                <div
                  role="img"
                  aria-label="Line chart displaying history of total carbon emissions"
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={progressData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}t`}
                      />
                      <Tooltip content={<CustomLineTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="hsl(142, 72%, 29%)"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: 'hsl(142, 72%, 29%)' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Screen Reader Table Fallback */}
                <div className="sr-only">
                  <table>
                    <caption>Assessment History</caption>
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Total Footprint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progressData.map((d) => (
                        <tr key={d.raw}>
                          <td>{d.date}</td>
                          <td>{d.total}t CO₂/yr</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </figure>
            )}

            {activeTab === 'forecast' && (
              <figure className="h-full w-full space-y-4">
                <figcaption className="sr-only">
                  Area chart displaying a 12-month carbon reduction glide path estimate
                </figcaption>
                <div
                  role="img"
                  aria-label="Area chart displaying a 12-month carbon reduction glide path estimate"
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={forecastData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 72%, 29%)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(142, 72%, 29%)" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}t`}
                      />
                      <Tooltip content={<CustomForecastTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="totalTonnes"
                        stroke="hsl(142, 72%, 29%)"
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        strokeWidth={2.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Screen Reader Table Fallback */}
                <div className="sr-only">
                  <table>
                    <caption>12-Month Reduction Forecast Glidepath</caption>
                    <thead>
                      <tr>
                        <th scope="col">Month</th>
                        <th scope="col">Projected Footprint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastData.map((d) => (
                        <tr key={d.monthIndex}>
                          <td>{d.month}</td>
                          <td>{d.totalTonnes}t CO₂/yr</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </figure>
            )}

            {activeTab === 'scoreTrend' && (
              <figure className="h-full w-full space-y-4">
                <figcaption className="sr-only">
                  Line chart displaying history of community standing percentile rank
                </figcaption>
                <div
                  role="img"
                  aria-label="Line chart displaying history of community standing percentile rank"
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={scoreTrendData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}th`}
                        reversed // Lower percentile (e.g. 1st) is better, so reverse the axis for intuitive UX
                      />
                      <Tooltip content={<CustomScoreTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="percentile"
                        stroke="hsl(271, 91%, 65%)"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: 'hsl(271, 91%, 65%)' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Screen Reader Table Fallback */}
                <div className="sr-only">
                  <table>
                    <caption>Community Standing History</caption>
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Percentile Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreTrendData.map((d, index) => (
                        <tr key={index}>
                          <td>{d.date}</td>
                          <td>{d.percentile}th</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </figure>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Forecast disclaimer */}
      {activeTab === 'forecast' && (
        <p className="px-4 text-center text-[10px] leading-relaxed text-muted-foreground">
          Disclaimer: Projections and forecasts display an estimated outcome based on standard
          climate-tech reduction factors. Projections are mathematical estimates and not guaranteed
          results. Actual footprint reductions vary based on user habits and local grid updates.
        </p>
      )}
    </div>
  );
});
