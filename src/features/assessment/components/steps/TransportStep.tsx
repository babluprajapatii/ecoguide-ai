'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TransportInput, FuelType } from '@/features/assessment/types/assessment.types';
import { transportInputSchema } from '@/features/assessment/schemas/assessment.schemas';

interface TransportStepProps {
  initialData: TransportInput;
  onNext: (data: TransportInput) => void;
  isSaving?: boolean;
}

export function TransportStep({ initialData, onNext, isSaving }: TransportStepProps) {
  const [fuelType, setFuelType] = useState<FuelType>(initialData.fuelType);
  const [weeklyKm, setWeeklyKm] = useState(initialData.weeklyKm);
  const [publicTransportWeeklyHours, setPublicTransportWeeklyHours] = useState(initialData.publicTransportWeeklyHours);
  const [rideShareWeeklyKm, setRideShareWeeklyKm] = useState(initialData.rideShareWeeklyKm);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: TransportInput = {
      fuelType,
      weeklyKm: fuelType === 'none' ? 0 : weeklyKm,
      publicTransportWeeklyHours,
      rideShareWeeklyKm,
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
    { value: 'none', label: 'No personal vehicle' },
    { value: 'petrol', label: 'Petrol vehicle' },
    { value: 'diesel', label: 'Diesel vehicle' },
    { value: 'electric', label: 'Electric vehicle' },
    { value: 'hybrid', label: 'Hybrid vehicle' },
  ];

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Transportation</h2>
        <p className="text-sm text-muted-foreground">
          Enter your average weekly transportation habits.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="fuelType" className="mb-1 block text-sm font-medium text-foreground">
            Primary Vehicle Type
          </label>
          <select
            id="fuelType"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value as FuelType)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {fuelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {fuelType !== 'none' && (
          <div>
            <label htmlFor="weeklyKm" className="mb-1 block text-sm font-medium text-foreground">
              Weekly Distance Driven (km)
            </label>
            <input
              id="weeklyKm"
              type="number"
              min={0}
              max={10000}
              value={weeklyKm}
              onChange={(e) => setWeeklyKm(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        <div>
          <label htmlFor="publicTransportWeeklyHours" className="mb-1 block text-sm font-medium text-foreground">
            Public Transport (hours/week)
          </label>
          <input
            id="publicTransportWeeklyHours"
            type="number"
            min={0}
            max={168}
            value={publicTransportWeeklyHours}
            onChange={(e) => setPublicTransportWeeklyHours(Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="rideShareWeeklyKm" className="mb-1 block text-sm font-medium text-foreground">
            Ride Sharing / Carpooling (km/week)
          </label>
          <input
            id="rideShareWeeklyKm"
            type="number"
            min={0}
            max={5000}
            value={rideShareWeeklyKm}
            onChange={(e) => setRideShareWeeklyKm(Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Next
      </button>

      {isSaving && (
        <p className="text-center text-xs text-muted-foreground animate-pulse mt-2">
          Saving draft...
        </p>
      )}
    </motion.form>
  );
}
