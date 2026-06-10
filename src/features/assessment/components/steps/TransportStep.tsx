'use client';

import { useState } from 'react';
import type { TransportInput, FuelType, FlightType } from '@/features/assessment/types/assessment.types';
import { transportInputSchema } from '@/features/assessment/schemas/assessment.schemas';

interface TransportStepProps {
  initialData: TransportInput;
  onNext: (data: TransportInput) => void;
}

/**
 * Transport step — collects car and flight travel data.
 */
export function TransportStep({ initialData, onNext }: TransportStepProps) {
  const [hasCar, setHasCar] = useState(!!initialData.car);
  const [weeklyKm, setWeeklyKm] = useState(initialData.car?.weeklyKm ?? 0);
  const [fuelType, setFuelType] = useState<FuelType>(initialData.car?.fuelType ?? 'petrol');

  const [shortHaulFlights, setShortHaulFlights] = useState(
    initialData.flights.find((f) => f.type === 'short-haul')?.flightsPerYear ?? 0,
  );
  const [shortHaulDist, setShortHaulDist] = useState(
    initialData.flights.find((f) => f.type === 'short-haul')?.avgDistanceKm ?? 800,
  );
  const [longHaulFlights, setLongHaulFlights] = useState(
    initialData.flights.find((f) => f.type === 'long-haul')?.flightsPerYear ?? 0,
  );
  const [longHaulDist, setLongHaulDist] = useState(
    initialData.flights.find((f) => f.type === 'long-haul')?.avgDistanceKm ?? 5000,
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const flights: { flightsPerYear: number; avgDistanceKm: number; type: FlightType }[] = [];
    if (shortHaulFlights > 0) {
      flights.push({ flightsPerYear: shortHaulFlights, avgDistanceKm: shortHaulDist, type: 'short-haul' });
    }
    if (longHaulFlights > 0) {
      flights.push({ flightsPerYear: longHaulFlights, avgDistanceKm: longHaulDist, type: 'long-haul' });
    }

    const data: TransportInput = {
      car: hasCar ? { weeklyKm, fuelType } : undefined,
      flights,
    };

    const result = transportInputSchema.safeParse(data);
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? 'Invalid transport data');
      return;
    }
    setError(null);
    onNext(result.data);
  };

  const fuelOptions: { value: FuelType; label: string }[] = [
    { value: 'petrol', label: 'Petrol' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'electric', label: 'Electric' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Transport</h2>

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-2 text-sm font-medium text-foreground">Car Travel</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hasCar}
            onChange={(e) => setHasCar(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          I drive a car
        </label>
        {hasCar && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="weeklyKm" className="mb-1 block text-sm font-medium text-foreground">
                Weekly km
              </label>
              <input
                id="weeklyKm"
                type="number"
                min={0}
                value={weeklyKm}
                onChange={(e) => setWeeklyKm(Number(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="fuelType" className="mb-1 block text-sm font-medium text-foreground">
                Fuel type
              </label>
              <select
                id="fuelType"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {fuelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-2 text-sm font-medium text-foreground">Flights</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="shortHaulFlights" className="mb-1 block text-sm font-medium">Short-haul flights/yr</label>
            <input id="shortHaulFlights" type="number" min={0} value={shortHaulFlights} onChange={(e) => setShortHaulFlights(Number(e.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="shortHaulDist" className="mb-1 block text-sm font-medium">Avg distance (km)</label>
            <input id="shortHaulDist" type="number" min={0} value={shortHaulDist} onChange={(e) => setShortHaulDist(Number(e.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="longHaulFlights" className="mb-1 block text-sm font-medium">Long-haul flights/yr</label>
            <input id="longHaulFlights" type="number" min={0} value={longHaulFlights} onChange={(e) => setLongHaulFlights(Number(e.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="longHaulDist" className="mb-1 block text-sm font-medium">Avg distance (km)</label>
            <input id="longHaulDist" type="number" min={0} value={longHaulDist} onChange={(e) => setLongHaulDist(Number(e.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
        </div>
      </fieldset>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <button type="submit" className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
        Next
      </button>
    </form>
  );
}
