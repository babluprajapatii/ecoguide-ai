'use client';

import type {
  TransportInput,
  DietInput,
  EnergyInput,
  ShoppingInput,
  FootprintBreakdown,
} from '@/features/assessment/types/assessment.types';
import { calculateTotalFootprint } from '@/features/assessment/services/carbon-calculator.service';

interface ReviewStepProps {
  transport: TransportInput;
  diet: DietInput;
  energy: EnergyInput;
  shopping: ShoppingInput;
  result: FootprintBreakdown | null;
  isSubmitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}

function formatKg(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}t`;
  }
  return `${Math.round(kg)} kg`;
}

/**
 * Review step — shows all answers and calculated breakdown before submission.
 */
export function ReviewStep({
  transport,
  diet,
  energy,
  shopping,
  result,
  isSubmitting,
  error,
  onBack,
  onSubmit,
}: ReviewStepProps) {
  const preview = calculateTotalFootprint({ transport, diet, energy, shopping });

  const breakdown = result ?? preview;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Review Your Assessment</h2>

      <div className="space-y-4">
        <section className="rounded-lg border border-border p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Transport</h3>
          {transport.car ? (
            <p className="text-sm">{transport.car.weeklyKm} km/week · {transport.car.fuelType}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No car</p>
          )}
          {transport.flights.length > 0 ? (
            transport.flights.map((f, i) => (
              <p key={`${f.type}-${i}`} className="text-sm">{f.flightsPerYear} {f.type} flights · {f.avgDistanceKm} km avg</p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No flights</p>
          )}
          <p className="mt-1 text-sm font-semibold text-primary">{formatKg(breakdown.transport)} CO₂/yr</p>
        </section>

        <section className="rounded-lg border border-border p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Diet</h3>
          <p className="text-sm capitalize">{diet.dietType.replace('-', ' ')}</p>
          <p className="mt-1 text-sm font-semibold text-primary">{formatKg(breakdown.diet)} CO₂/yr</p>
        </section>

        <section className="rounded-lg border border-border p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Energy</h3>
          <p className="text-sm">{energy.electricityKwhPerMonth} kWh electricity · {energy.gasKwhPerMonth} kWh gas /month</p>
          <p className="mt-1 text-sm font-semibold text-primary">{formatKg(breakdown.energy)} CO₂/yr</p>
        </section>

        <section className="rounded-lg border border-border p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Shopping</h3>
          <p className="text-sm capitalize">{shopping.level} spending</p>
          <p className="mt-1 text-sm font-semibold text-primary">{formatKg(breakdown.shopping)} CO₂/yr</p>
        </section>

        <section className="rounded-lg border border-primary bg-primary/5 p-4">
          <h3 className="mb-1 text-sm font-medium text-foreground">Total Annual Footprint</h3>
          <p className="text-2xl font-bold text-primary">{formatKg(breakdown.total)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {breakdown.comparedToAverage < 1
              ? `${Math.round((1 - breakdown.comparedToAverage) * 100)}% below`
              : `${Math.round((breakdown.comparedToAverage - 1) * 100)}% above`}
            {' '}global average · {breakdown.percentile}th percentile
          </p>
        </section>
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          Back
        </button>
        {!result && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Assessment'}
          </button>
        )}
      </div>
    </div>
  );
}
