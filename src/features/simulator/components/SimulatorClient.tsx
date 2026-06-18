'use client';

/**
 * SimulatorClient — interactive "What If" scenario simulator.
 *
 * Left panel: sliders and toggles for lifestyle emissions category.
 * Right panel: live-updating forecast chart, saved simulations, and comparison metrics.
 *
 * @module SimulatorClient
 */

import { useCallback, useMemo, useState, memo } from 'react';
import dynamic from 'next/dynamic';
import { useSimulator } from '@/features/simulator/hooks/useSimulator';
import { useSimulatorDashboard } from '@/features/simulator/hooks/useSimulatorDashboard';
import type { FootprintBreakdown, DietType, FuelType, ShoppingLevel } from '@/features/assessment/types/assessment.types';
import { SCENARIO_PRESETS } from '@/features/simulator/types/simulator.types';
import { Save, Heart, Trash2, Layers, AlertCircle } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

// ---------------------------------------------------------------------------
// Lazy-loaded chart components
// ---------------------------------------------------------------------------

function ChartSkeleton() {
  return (
    <div className="flex h-[350px] items-center justify-center rounded-xl border border-border bg-card">
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

const ComparisonChart = dynamic(
  () => import('@/features/simulator/components/ComparisonChart'),
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
    <div className="space-y-2 py-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wide">
          <span aria-hidden="true">{icon}</span>
          {label}
        </label>
        <span className="text-xs font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
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
        className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-emerald-500 min-h-[44px]"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} ${unit}`}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
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
    <div className="space-y-2 py-1">
      <label htmlFor={id} className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wide">
        <span aria-hidden="true">{icon}</span>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[44px]"
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
  const {
    simulations,
    saveSimulation,
    deleteSimulation,
    toggleFavorite,
  } = useSimulatorDashboard();

  const [activeTab, setActiveTab] = useState<'forecast' | 'saved' | 'compare'>('forecast');
  const [newScenarioName, setNewScenarioName] = useState('');
  const [checkedSims, setCheckedSims] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const shoppingOptions: { value: string; label: string }[] = useMemo(
    () => [
      { value: '', label: 'Keep current' },
      { value: 'low', label: '🧘 Minimal' },
      { value: 'medium', label: '🛍️ Moderate' },
      { value: 'high', label: '🛒 Frequent' },
    ],
    [],
  );

  const {
    adjustments,
    totalSavings,
    savingsPercent,
    costSavings,
    waterSavings,
    wasteSavings,
    impactScore,
    tier,
    forecastMonths,
    setForecastMonths,
    setDietType,
    setCarFuelType,
    setShoppingLevel,
    setCarKmPerWeek,
  } = sim;

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

  const getScenarioType = useCallback(() => {
    const adj = adjustments;
    const modified: string[] = [];
    if (adj.carKmPerWeek !== null || adj.carFuelType !== null) modified.push('ev');
    if (adj.dietType !== null) modified.push('diet');
    if (adj.renewableEnergyPercent > 0) modified.push('solar');
    if (adj.flightHoursPerYear !== null) modified.push('flights');
    if (adj.shoppingLevel !== null) modified.push('shopping');

    if (modified.length === 1) return modified[0] as 'ev' | 'solar' | 'diet' | 'flights' | 'shopping';
    return 'custom';
  }, [adjustments]);

  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!newScenarioName.trim()) return;

    try {
      await saveSimulation({
        scenario_name: newScenarioName.trim(),
        scenario_type: getScenarioType(),
        configuration: adjustments,
        estimated_carbon_savings: totalSavings,
        estimated_cost_savings: costSavings,
        impact_score: impactScore,
      });
      setNewScenarioName('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save scenario.');
    }
  };

  const handleToggleCheck = (id: string) => {
    setCheckedSims((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedForCompare = useMemo(
    () => simulations.filter((s) => checkedSims.includes(s.id)),
    [simulations, checkedSims]
  );

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <div className="space-y-6">
      {/* --- Header --- */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <Layers className="text-emerald-500" size={24} />
          <span>Carbon Impact Simulator</span>
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Forecast &quot;what-if&quot; lifestyle choices side-by-side and calculate synergistic carbon reductions and energy bill offsets.
        </p>
      </div>

      {/* --- Top Savings Displays Row --- */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <div className="rounded-2xl border border-border/80 bg-card/40 p-4 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Carbon Savings</p>
          <p className="text-base font-extrabold text-emerald-500 tabular-nums">
            {(totalSavings / 1000).toFixed(1)} t/yr
          </p>
          <p className="text-[9px] text-muted-foreground">-{savingsPercent}% footprint</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/40 p-4 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Utility Offsets</p>
          <p className="text-base font-extrabold text-blue-500 tabular-nums">
            ${costSavings.toFixed(0)}/yr
          </p>
          <p className="text-[9px] text-muted-foreground">Estimated savings</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/40 p-4 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Water Conserved</p>
          <p className="text-base font-extrabold text-cyan-500 tabular-nums">
            {waterSavings.toLocaleString()} L
          </p>
          <p className="text-[9px] text-muted-foreground">Annual diet savings</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/40 p-4 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Waste Reduced</p>
          <p className="text-base font-extrabold text-purple-500 tabular-nums">
            {wasteSavings} kg/yr
          </p>
          <p className="text-[9px] text-muted-foreground">Sustainable shopping</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/40 p-4 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-1 col-span-2 md:col-span-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Impact Score</p>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
              tier === 'Platinum' ? 'bg-purple-500/10 text-purple-500' :
              tier === 'Gold' ? 'bg-yellow-500/10 text-yellow-500' :
              tier === 'Silver' ? 'bg-slate-500/10 text-slate-500' :
              'bg-amber-600/10 text-amber-600'
            }`}>
              {tier}
            </span>
            <span className="text-sm font-extrabold text-foreground">{impactScore}/100</span>
          </div>
          <p className="text-[9px] text-muted-foreground">Calculated sustainability rank</p>
        </div>
      </div>

      {/* --- Scenario Presets --- */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Quick Templates</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Scenario presets">
          {SCENARIO_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => sim.applyPreset(preset.adjustments)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-all hover:border-emerald-500/20 hover:bg-muted/10 active:scale-[0.98] min-h-[44px]"
              title={preset.description}
            >
              <span aria-hidden="true">{preset.icon}</span>
              {preset.name}
            </button>
          ))}
          <button
            type="button"
            onClick={sim.reset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:border-red-500/25 hover:text-red-500 active:scale-[0.98] min-h-[44px]"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* --- Main Workspace --- */}
      <div className="grid gap-6 lg:grid-cols-5 items-start">
        {/* Left column: Sliders */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-border/85 bg-card/40 p-5 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-5">
            <h3 className="text-sm font-bold text-foreground border-b border-border/40 pb-2 uppercase tracking-wider">
              Adjust Lifestyle Parameters
            </h3>

            <SliderControl
              id="sim-car-km"
              label="Weekly Driving Km"
              unit="km/wk"
              min={0}
              max={500}
              step={5}
              value={adjustments.carKmPerWeek ?? 0}
              onChange={handleCarKmChange}
              icon="🚗"
            />

            <SelectControl
              id="sim-fuel-type"
              label="Vehicle Fuel Type"
              value={adjustments.carFuelType ?? ''}
              options={fuelOptions}
              onChange={handleFuelChange}
              icon="⛽"
            />

            <SliderControl
              id="sim-flights"
              label="Annual Flight Hours"
              unit="hrs/yr"
              min={0}
              max={100}
              step={1}
              value={adjustments.flightHoursPerYear ?? 0}
              onChange={(v) => sim.setFlightHoursPerYear(v > 0 ? v : null)}
              icon="✈️"
            />

            <SelectControl
              id="sim-diet"
              label="Diet Style"
              value={adjustments.dietType ?? ''}
              options={dietOptions}
              onChange={handleDietChange}
              icon="🥗"
            />

            <SliderControl
              id="sim-solar"
              label="Home Renewable Energy"
              unit="%"
              min={0}
              max={100}
              step={5}
              value={adjustments.renewableEnergyPercent}
              onChange={sim.setRenewableEnergyPercent}
              icon="☀️"
            />

            <SelectControl
              id="sim-shopping"
              label="Shopping Frequency"
              value={adjustments.shoppingLevel ?? ''}
              options={shoppingOptions}
              onChange={handleShoppingChange}
              icon="🛒"
            />
          </div>

          {/* Scenario Persistence Form */}
          <form onSubmit={handleSaveScenario} className="rounded-2xl border border-border/85 bg-card/40 p-5 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Save Current Scenario</h3>
            <div className="space-y-2">
              <input
                required
                type="text"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="e.g. My EV + Solar synergy plan"
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[44px]"
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 transition-colors min-h-[44px]"
              >
                <Save size={13} />
                <span>Save Simulation</span>
              </button>
            </div>
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold mt-2">
                <AlertCircle size={12} />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right column: Charts and Lists */}
        <div className="space-y-5 lg:col-span-3">
          {/* Tabs header */}
          <div className="flex border-b border-border/60 gap-4" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'forecast'}
              onClick={() => setActiveTab('forecast')}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all min-h-[44px] px-2 ${
                activeTab === 'forecast'
                  ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              12-Month Forecast
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'saved'}
              onClick={() => setActiveTab('saved')}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all min-h-[44px] px-2 ${
                activeTab === 'saved'
                  ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Saved Scenarios ({simulations.length})
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'compare'}
              onClick={() => setActiveTab('compare')}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all min-h-[44px] px-2 ${
                activeTab === 'compare'
                  ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Comparison View ({checkedSims.length})
            </button>
          </div>

          {/* Forecast tab */}
          {activeTab === 'forecast' && (
            <div className="rounded-2xl border border-border bg-card/40 p-5 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Projected Emissions</h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Duration:</span>
                  <select
                    value={forecastMonths}
                    onChange={(e) => setForecastMonths(Number(e.target.value))}
                    className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={1}>1 Month</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                    <option value={24}>24 Months</option>
                  </select>
                </div>
              </div>
              <ForecastChart forecast={sim.forecast} />
            </div>
          )}

          {/* Saved simulations list tab */}
          {activeTab === 'saved' && (
            <div className="rounded-2xl border border-border bg-card/40 p-5 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase border-b border-border/40 pb-2 tracking-wider">
                Saved Scenarios
              </h3>
              {simulations.length === 0 ? (
                <div className="text-center py-10 text-xs font-medium text-muted-foreground border border-dashed border-border/80 rounded-xl">
                  No saved simulations yet. Adjust sliders on the left and input a name to save.
                </div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {simulations.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      className="flex items-start justify-between gap-3 p-4 rounded-xl border border-border/40 bg-card/50 transition-all hover:border-emerald-500/15"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={checkedSims.includes(item.id)}
                          onChange={() => handleToggleCheck(item.id)}
                          className="mt-1 h-4 w-4 cursor-pointer accent-emerald-500"
                          title={`Select ${item.scenario_name} for comparison`}
                        />
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate">{item.scenario_name}</h4>
                          <div className="flex flex-wrap gap-1.5 text-[9px] font-extrabold uppercase text-muted-foreground">
                            <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full">Score: {item.impact_score}</span>
                            <span className="bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full">Savings: ${(item.estimated_cost_savings).toFixed(0)}/yr</span>
                            <span className="bg-slate-500/10 px-1.5 py-0.5 rounded-full">{item.scenario_type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item.id, item.is_favorite)}
                          aria-label={`Toggle favorite for ${item.scenario_name}`}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            item.is_favorite
                              ? 'text-red-500 border-red-500/20 bg-red-500/10'
                              : 'text-muted-foreground border-border bg-transparent hover:text-foreground'
                          }`}
                        >
                          <Heart size={12} fill={item.is_favorite ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          type="button"
                          onClick={() => sim.applyPreset(item.configuration)}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1.5"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSimulation(item.id)}
                          aria-label={`Delete scenario ${item.scenario_name}`}
                          className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Comparison View Tab */}
          {activeTab === 'compare' && (
            <div className="rounded-2xl border border-border bg-card/40 p-5 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase border-b border-border/40 pb-2 tracking-wider">
                Scenario Comparison Dashboard
              </h3>
              {selectedForCompare.length < 2 ? (
                <div className="text-center py-10 text-xs font-medium text-muted-foreground border border-dashed border-border/80 rounded-xl space-y-2">
                  <p>Please select at least 2 saved scenarios from the list to compare them side-by-side.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('saved')}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Go to Saved Scenarios list →
                  </button>
                </div>
              ) : (
                <ComparisonChart selectedSimulations={selectedForCompare} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
