'use client';

import { useState } from 'react';
import type { EnergyInput } from '@/features/assessment/types/assessment.types';
import { energyInputSchema } from '@/features/assessment/schemas/assessment.schemas';

interface EnergyStepProps {
  initialData: EnergyInput;
  onNext: (data: EnergyInput) => void;
  onBack: () => void;
}

/**
 * Energy step — collects monthly electricity and gas usage.
 */
export function EnergyStep({ initialData, onNext, onBack }: EnergyStepProps) {
  const [electricityKwhPerMonth, setElectricity] = useState(initialData.electricityKwhPerMonth);
  const [gasKwhPerMonth, setGas] = useState(initialData.gasKwhPerMonth);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = energyInputSchema.safeParse({ electricityKwhPerMonth, gasKwhPerMonth });
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? 'Invalid energy data');
      return;
    }
    setError(null);
    onNext(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Energy</h2>
      <p className="text-sm text-muted-foreground">Enter your average monthly household energy usage. Check your utility bills for accuracy.</p>

      <div className="space-y-4">
        <div>
          <label htmlFor="electricity" className="mb-1 block text-sm font-medium text-foreground">
            Electricity (kWh/month)
          </label>
          <input
            id="electricity"
            type="number"
            min={0}
            value={electricityKwhPerMonth}
            onChange={(e) => setElectricity(Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="gas" className="mb-1 block text-sm font-medium text-foreground">
            Natural Gas (kWh/month)
          </label>
          <input
            id="gas"
            type="number"
            min={0}
            value={gasKwhPerMonth}
            onChange={(e) => setGas(Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
          Back
        </button>
        <button type="submit" className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          Next
        </button>
      </div>
    </form>
  );
}
