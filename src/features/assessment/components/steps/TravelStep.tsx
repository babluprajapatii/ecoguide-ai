'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TravelInput } from '@/features/assessment/types/assessment.types';
import { travelInputSchema } from '@/features/assessment/schemas/assessment.schemas';

interface TravelStepProps {
  initialData: TravelInput;
  onNext: (data: TravelInput) => void;
  onBack: () => void;
  isSaving?: boolean;
}

export function TravelStep({ initialData, onNext, onBack, isSaving }: TravelStepProps) {
  const [flightsPerYear, setFlightsPerYear] = useState(initialData.flightsPerYear);
  const [avgDistanceKm, setAvgDistanceKm] = useState(initialData.avgDistanceKm);
  const [hotelStaysPerYear, setHotelStaysPerYear] = useState(initialData.hotelStaysPerYear);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = travelInputSchema.safeParse({
      flightsPerYear,
      avgDistanceKm: flightsPerYear > 0 ? avgDistanceKm : 0,
      hotelStaysPerYear,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    onNext(result.data);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Travel &amp; Flights</h2>
        <p className="text-sm text-muted-foreground">
          Enter your travel habits, including flight frequencies and lodging stays.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="flightsPerYear"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Flights per year
          </label>
          <input
            id="flightsPerYear"
            type="number"
            min={0}
            max={200}
            value={flightsPerYear}
            onChange={(e) => {
              setFlightsPerYear(Number(e.target.value));
              setFieldErrors((prev) => ({ ...prev, flightsPerYear: '' }));
            }}
            aria-invalid={!!fieldErrors.flightsPerYear}
            aria-describedby={fieldErrors.flightsPerYear ? 'flightsPerYear-error' : undefined}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {fieldErrors.flightsPerYear && (
            <p id="flightsPerYear-error" className="mt-1 text-xs text-destructive" role="alert">
              {fieldErrors.flightsPerYear}
            </p>
          )}
        </div>

        {flightsPerYear > 0 && (
          <div>
            <label
              htmlFor="avgDistanceKm"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Average flight distance (km)
            </label>
            <input
              id="avgDistanceKm"
              type="number"
              min={0}
              max={20000}
              value={avgDistanceKm}
              onChange={(e) => {
                setAvgDistanceKm(Number(e.target.value));
                setFieldErrors((prev) => ({ ...prev, avgDistanceKm: '' }));
              }}
              aria-invalid={!!fieldErrors.avgDistanceKm}
              aria-describedby={fieldErrors.avgDistanceKm ? 'avgDistanceKm-error' : undefined}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {fieldErrors.avgDistanceKm && (
              <p id="avgDistanceKm-error" className="mt-1 text-xs text-destructive" role="alert">
                {fieldErrors.avgDistanceKm}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Short-haul: &lt;1,500 km (e.g. domestic/regional). Long-haul: &ge;1,500 km
              (transcontinental).
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="hotelStaysPerYear"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Hotel stays (nights per year)
          </label>
          <input
            id="hotelStaysPerYear"
            type="number"
            min={0}
            max={365}
            value={hotelStaysPerYear}
            onChange={(e) => {
              setHotelStaysPerYear(Number(e.target.value));
              setFieldErrors((prev) => ({ ...prev, hotelStaysPerYear: '' }));
            }}
            aria-invalid={!!fieldErrors.hotelStaysPerYear}
            aria-describedby={fieldErrors.hotelStaysPerYear ? 'hotelStaysPerYear-error' : undefined}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {fieldErrors.hotelStaysPerYear && (
            <p id="hotelStaysPerYear-error" className="mt-1 text-xs text-destructive" role="alert">
              {fieldErrors.hotelStaysPerYear}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Next
        </button>
      </div>

      {isSaving && (
        <p className="mt-2 animate-pulse text-center text-xs text-muted-foreground">
          Saving draft...
        </p>
      )}
    </motion.form>
  );
}
