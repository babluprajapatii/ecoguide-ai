'use client';

/**
 * SimulatorClient — interactive "What If" scenario simulator.
 *
 * Left panel: sliders and toggles for each emissions category.
 * Right panel: live-updating 12-month forecast chart.
 * Top: headline savings display and scenario presets.
 *
 * @module SimulatorClient
 */

import React, { useCallback, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { useSimulator } from '@/features/simulator/hooks/useSimulator';
import type { FootprintBreakdown, DietType, FuelType, ShoppingLevel } from '@/features/assessment/types/assessment.types';
import { SCENARIO_PRESETS } from '@/features/simulator/types/simulator.types';

// ---------------------------------------------------------------------------
// Lazy-loaded chart component (keeps Recharts out of initial bundle)
// ---------------------------------------------------------------------------

function ChartSkeleton() {
  return (
    <div className="flex h-[400px] items-center justify-center rounded-xl border border-border bg-card">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

const ForecastChart = dynamic(
  () => import('@/features/simulator/components/ForecastChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  },
);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SliderControlProps {
  readonly id: string;
  readonly label: string;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly icon: string;
}

const SliderControl = memo(function SliderControl({
  id,
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
  icon,
}: SliderControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span aria-hidden="true">{icon}</span>
          {label}
        </label>
        <span className="text-sm font-semibold tabular-nums text-primary">
          {value} {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} ${unit}`}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
});

interface SelectControlProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly options: readonly { value: string; label: string }[];
  readonly onChange: (value: string) => void;
  readonly icon: string;
}

const SelectControl = memo(function SelectControl({
  id,
  label,
  value,
  options,
  onChange,
  icon,
}: SelectControlProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span aria-hidden="true">{icon}</span>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface SimulatorClientProps {
  readonly baseline?: FootprintBreakdown;
}

export function SimulatorClient({ baseline }: SimulatorClientProps) {
  const sim = useSimulator(baseline);

  // Diet options
  const dietOptions: { value: string; label: string }[] = useMemo(
    () => [
      { value: '', label: 'Keep current' },
      { value: 'vegan', label: '🌱 Vegan' },
      { value: 'vegetarian', label: '🥬 Vegetarian' },
      { value: 'mixed', label: '🍽️ Mixed' },
      { value: 'meat-heavy', label: '🥩 Meat-heavy' },
    ],
    [],
  );

  // Fuel type options
  const fuelOptions: { value: string; label: string }[] = useMemo(
    () => [
      { value: '', label: 'Keep current' },
      { value: 'petrol', label: '⛽ Petrol' },
      { value: 'diesel', label: '⛽ Diesel' },
      { value: 'hybrid', label: '🔋 Hybrid' },
      { value: 'electric', label: '⚡ Electric' },
    ],
    [],
  );

  // Shopping options
  const shoppingOptions: { value: string; label: string }[] = useMemo(
    () => [
      { value: '', label: 'Keep current' },
      { value: 'low', label: '🧘 Minimal' },
      { value: 'medium', label: '🛍️ Moderate' },
      { value: 'high', label: '🛒 Frequent' },
    ],
    [],
  );

  const { setDietType, setCarFuelType, setShoppingLevel, setCarKmPerWeek, encodeToUrl } = sim;

  const handleDietChange = useCallback(
    (v: string) => setDietType(v ? (v as DietType) : null),
    [setDietType],
  );

  const handleFuelChange = useCallback(
    (v: string) => setCarFuelType(v ? (v as FuelType) : null),
    [setCarFuelType],
  );

  const handleShoppingChange = useCallback(
    (v: string) => setShoppingLevel(v ? (v as ShoppingLevel) : null),
    [setShoppingLevel],
  );

  const handleCarKmChange = useCallback(
    (v: number) => setCarKmPerWeek(v > 0 ? v : null),
    [setCarKmPerWeek],
  );

  const handleShareScenario = useCallback(async () => {
    const url = encodeToUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback — select the URL for manual copy
      window.prompt('Copy this URL:', url);
    }
  }, [encodeToUrl]);

  // Savings color
  const savingsColorClass = sim.totalSavings > 0
    ? 'text-emerald-500'
    : sim.totalSavings < 0
      ? 'text-red-500'
      : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      {/* --- Header --- */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Impact Simulator
        </h1>
        <p className="text-sm text-muted-foreground">
          Explore &quot;what if&quot; scenarios and see how lifestyle changes could reduce your carbon footprint.
        </p>
      </div>

      {/* --- Savings Headline --- */}
      <div
        className="rounded-xl border border-border bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 p-6 text-center"
        aria-live="polite"
      >
        <p className="text-sm font-medium text-muted-foreground">
          Potential Annual Savings
        </p>
        <p
          className={`mt-1 text-4xl font-extrabold tabular-nums ${savingsColorClass}`}
          aria-label={`You could save ${(Math.abs(sim.totalSavings) / 1000).toFixed(1)} tonnes CO2 per year, a ${Math.abs(sim.savingsPercent)}% ${sim.totalSavings >= 0 ? 'reduction' : 'increase'}`}
        >
          {sim.totalSavings >= 0 ? '−' : '+'}{(Math.abs(sim.totalSavings) / 1000).toFixed(1)}{' '}
          <span className="text-xl font-semibold">tonnes CO₂/yr</span>
        </p>
        {sim.savingsPercent !== 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            That&apos;s a {Math.abs(sim.savingsPercent)}% {sim.totalSavings >= 0 ? 'reduction' : 'increase'} from your current footprint
          </p>
        )}
      </div>

      {/* --- Scenario Presets --- */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Quick Scenarios</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Scenario presets">
          {SCENARIO_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => sim.applyPreset(preset.adjustments)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:shadow-sm active:scale-[0.97]"
              title={preset.description}
            >
              <span aria-hidden="true">{preset.icon}</span>
              {preset.name}
            </button>
          ))}
          <button
            type="button"
            onClick={sim.reset}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-destructive hover:text-destructive active:scale-[0.97]"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* --- Main Grid: Controls + Chart --- */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Panel: Sliders */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5 space-y-6">
            <h2 className="text-base font-semibold text-foreground">Adjust Your Lifestyle</h2>

            <SliderControl
              id="sim-car-km"
              label="Weekly Car Km"
              unit="km/wk"
              min={0}
              max={500}
              step={5}
              value={sim.adjustments.carKmPerWeek ?? 0}
              onChange={handleCarKmChange}
              icon="🚗"
            />

            <SelectControl
              id="sim-fuel-type"
              label="Vehicle Fuel Type"
              value={sim.adjustments.carFuelType ?? ''}
              options={fuelOptions}
              onChange={handleFuelChange}
              icon="⛽"
            />

            <SliderControl
              id="sim-flights"
              label="Flight Hours / Year"
              unit="hrs/yr"
              min={0}
              max={100}
              step={1}
              value={sim.adjustments.flightHoursPerYear ?? 0}
              onChange={(v) => sim.setFlightHoursPerYear(v > 0 ? v : null)}
              icon="✈️"
            />

            <SelectControl
              id="sim-diet"
              label="Diet Type"
              value={sim.adjustments.dietType ?? ''}
              options={dietOptions}
              onChange={handleDietChange}
              icon="🥗"
            />

            <SliderControl
              id="sim-solar"
              label="Renewable Energy"
              unit="%"
              min={0}
              max={100}
              step={5}
              value={sim.adjustments.renewableEnergyPercent}
              onChange={sim.setRenewableEnergyPercent}
              icon="☀️"
            />

            <SelectControl
              id="sim-shopping"
              label="Shopping Level"
              value={sim.adjustments.shoppingLevel ?? ''}
              options={shoppingOptions}
              onChange={handleShoppingChange}
              icon="🛒"
            />
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShareScenario}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
          >
            📤 Share My Scenario
          </button>
        </div>

        {/* Right Panel: Chart + Breakdown */}
        <div className="space-y-5 lg:col-span-3">
          {/* Forecast chart */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-semibold text-foreground">
              12-Month Forecast
            </h2>
            <ForecastChart forecast={sim.forecast} />
          </div>

          {/* Category comparison */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-base font-semibold text-foreground">Category Comparison</h2>
            <div className="space-y-3">
              <CategoryBar label="Transport" icon="🚗" baseline={sim.baseline.transport} projected={sim.projected.transport} />
              <CategoryBar label="Diet" icon="🥗" baseline={sim.baseline.diet} projected={sim.projected.diet} />
              <CategoryBar label="Energy" icon="⚡" baseline={sim.baseline.energy} projected={sim.projected.energy} />
              <CategoryBar label="Shopping" icon="🛒" baseline={sim.baseline.shopping} projected={sim.projected.shopping} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CategoryBar — horizontal comparison bar
// ---------------------------------------------------------------------------

interface CategoryBarProps {
  readonly label: string;
  readonly icon: string;
  readonly baseline: number;
  readonly projected: number;
}

const CategoryBar = memo(function CategoryBar({ label, icon, baseline, projected }: CategoryBarProps) {
  const maxVal = Math.max(baseline, projected, 1);
  const baselineWidth = (baseline / maxVal) * 100;
  const projectedWidth = (projected / maxVal) * 100;
  const diff = baseline - projected;
  const diffPercent = baseline > 0 ? Math.round((diff / baseline) * 100) : 0;

  return (
    <div
      className="space-y-1"
      aria-label={`${label}: ${(baseline / 1000).toFixed(1)}t baseline vs ${(projected / 1000).toFixed(1)}t projected`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 font-medium text-foreground">
          <span aria-hidden="true">{icon}</span>
          {label}
        </span>
        <span className={`font-semibold tabular-nums ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
          {diff > 0 ? `−${(diff / 1000).toFixed(1)}t` : diff < 0 ? `+${(Math.abs(diff) / 1000).toFixed(1)}t` : 'No change'}
          {diffPercent !== 0 && ` (${Math.abs(diffPercent)}%)`}
        </span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-muted-foreground/30 transition-all duration-500"
          style={{ width: `${baselineWidth}%` }}
          title={`Baseline: ${(baseline / 1000).toFixed(1)}t`}
        />
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${projectedWidth}%` }}
          title={`Projected: ${(projected / 1000).toFixed(1)}t`}
        />
      </div>
    </div>
  );
});
