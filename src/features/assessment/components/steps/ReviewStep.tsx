'use client';

import { motion } from 'framer-motion';
import type {
  TransportInput,
  DietInput,
  EnergyInput,
  ShoppingInput,
  TravelInput,
  FootprintBreakdown,
} from '@/features/assessment/types/assessment.types';
import { calculateTotalFootprint } from '@/features/assessment/services/carbon-calculator.service';

interface ReviewStepProps {
  transport: TransportInput;
  energy: EnergyInput;
  diet: DietInput;
  shopping: ShoppingInput;
  travel: TravelInput;
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

export function ReviewStep({
  transport,
  energy,
  diet,
  shopping,
  travel,
  result,
  isSubmitting,
  error,
  onBack,
  onSubmit,
}: ReviewStepProps) {
  const preview = calculateTotalFootprint({ transport, energy, diet, shopping, travel });
  const breakdown = result ?? preview;

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Review Your Assessment</h2>
        <p className="text-sm text-muted-foreground">
          Double-check your choices. Submit the form to calculate your final score, unlock
          achievements, and get personalized recommendations.
        </p>
      </div>

      <div className="space-y-4">
        <section className="rounded-lg border border-border p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Transport
          </h3>
          <ul className="space-y-1 text-sm text-foreground">
            {transport.fuelType !== 'none' ? (
              <li>
                <strong>Vehicle:</strong> {transport.weeklyKm} km/week driven ({transport.fuelType})
              </li>
            ) : (
              <li>No personal vehicle driven.</li>
            )}
            {transport.publicTransportWeeklyHours > 0 && (
              <li>
                <strong>Public Transport:</strong> {transport.publicTransportWeeklyHours} hrs/week
              </li>
            )}
            {transport.rideShareWeeklyKm > 0 && (
              <li>
                <strong>Ride Sharing:</strong> {transport.rideShareWeeklyKm} km/week
              </li>
            )}
          </ul>
          <p className="mt-2 text-sm font-semibold text-primary">
            Est. Emissions: {formatKg(breakdown.transport)} CO₂/yr
          </p>
        </section>

        <section className="rounded-lg border border-border p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Home Energy
          </h3>
          <ul className="space-y-1 text-sm text-foreground">
            <li>
              <strong>Electricity:</strong> {energy.electricityKwhPerMonth} kWh/month
            </li>
            <li>
              <strong>Natural Gas:</strong> {energy.gasKwhPerMonth} kWh/month
            </li>
            {energy.renewableEnergyPercent > 0 && (
              <li>
                <strong>Renewable Offset:</strong> {energy.renewableEnergyPercent}% clean energy
              </li>
            )}
            <li>
              <strong>Home Size &amp; Household:</strong> {energy.homeSizeSqFt} sq ft ·{' '}
              {energy.householdMembers} member(s)
            </li>
          </ul>
          <p className="mt-2 text-sm font-semibold text-primary">
            Est. Emissions: {formatKg(breakdown.energy)} CO₂/yr
          </p>
        </section>

        <section className="rounded-lg border border-border p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Diet
          </h3>
          <p className="text-sm capitalize">{diet.dietType.replace('-', ' ')} dietary pattern</p>
          <p className="mt-2 text-sm font-semibold text-primary">
            Est. Emissions: {formatKg(breakdown.diet)} CO₂/yr
          </p>
        </section>

        <section className="rounded-lg border border-border p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Shopping
          </h3>
          <p className="text-sm capitalize">{shopping.level} spending habits</p>
          <p className="mt-2 text-sm font-semibold text-primary">
            Est. Emissions: {formatKg(breakdown.shopping)} CO₂/yr
          </p>
        </section>

        <section className="rounded-lg border border-border p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Travel
          </h3>
          <ul className="space-y-1 text-sm text-foreground">
            {travel.flightsPerYear > 0 ? (
              <li>
                <strong>Flights:</strong> {travel.flightsPerYear} flights/yr at{' '}
                {travel.avgDistanceKm} km avg
              </li>
            ) : (
              <li>No annual flights.</li>
            )}
            {travel.hotelStaysPerYear > 0 && (
              <li>
                <strong>Lodging:</strong> {travel.hotelStaysPerYear} hotel night(s)/yr
              </li>
            )}
          </ul>
          <p className="mt-2 text-sm font-semibold text-primary">
            Est. Emissions: {formatKg(breakdown.travel)} CO₂/yr
          </p>
        </section>

        <section className="rounded-lg border border-primary bg-primary/5 p-4">
          <h3 className="mb-1 text-sm font-bold text-foreground">Pre-submission Total Footprint</h3>
          <p className="text-3xl font-extrabold text-primary">{formatKg(breakdown.total)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {breakdown.comparedToAverage < 1
              ? `${Math.round((1 - breakdown.comparedToAverage) * 100)}% below`
              : `${Math.round((breakdown.comparedToAverage - 1) * 100)}% above`}{' '}
            global average · {breakdown.percentile}th percentile rank
          </p>
        </section>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

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
    </motion.div>
  );
}
