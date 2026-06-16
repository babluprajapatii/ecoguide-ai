'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { EnergyInput } from '@/features/assessment/types/assessment.types';
import { energyInputSchema } from '@/features/assessment/schemas/assessment.schemas';

interface EnergyStepProps {
  initialData: EnergyInput;
  onNext: (data: EnergyInput) => void;
  onBack: () => void;
  isSaving?: boolean;
}

export function EnergyStep({ initialData, onNext, onBack, isSaving }: EnergyStepProps) {
  const [electricityKwhPerMonth, setElectricityKwhPerMonth] = useState(initialData.electricityKwhPerMonth);
  const [gasKwhPerMonth, setGasKwhPerMonth] = useState(initialData.gasKwhPerMonth);
  const [renewableEnergyPercent, setRenewableEnergyPercent] = useState(initialData.renewableEnergyPercent || 0);
  const [homeSizeSqFt, setHomeSizeSqFt] = useState(initialData.homeSizeSqFt || 0);
  const [householdMembers, setHouseholdMembers] = useState(initialData.householdMembers || 1);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      electricityKwhPerMonth,
      gasKwhPerMonth,
      renewableEnergyPercent,
      homeSizeSqFt,
      householdMembers,
    };

    const result = energyInputSchema.safeParse(data);
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? 'Invalid energy data');
      return;
    }
    setError(null);
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
        <h2 className="text-xl font-bold text-foreground">Home Energy</h2>
        <p className="text-sm text-muted-foreground">
          Enter your average monthly energy usage and household information.
        </p>
      </div>

      <div className="space-y-4 font-normal text-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="electricity" className="mb-1 block font-medium text-foreground">
              Electricity (kWh/month)
            </label>
            <input
              id="electricity"
              type="number"
              min={0}
              max={50000}
              value={electricityKwhPerMonth}
              onChange={(e) => setElectricityKwhPerMonth(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="gas" className="mb-1 block font-medium text-foreground">
              Natural Gas (kWh/month)
            </label>
            <input
              id="gas"
              type="number"
              min={0}
              max={50000}
              value={gasKwhPerMonth}
              onChange={(e) => setGasKwhPerMonth(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="renewable" className="mb-1 block font-medium text-foreground">
              Renewable Energy (%)
            </label>
            <input
              id="renewable"
              type="number"
              min={0}
              max={100}
              value={renewableEnergyPercent}
              onChange={(e) => setRenewableEnergyPercent(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="homeSize" className="mb-1 block font-medium text-foreground">
              Home Size (sq ft)
            </label>
            <input
              id="homeSize"
              type="number"
              min={0}
              max={50000}
              value={homeSizeSqFt}
              onChange={(e) => setHomeSizeSqFt(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="members" className="mb-1 block font-medium text-foreground">
              Household Members
            </label>
            <input
              id="members"
              type="number"
              min={1}
              max={100}
              value={householdMembers}
              onChange={(e) => setHouseholdMembers(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

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
        <p className="text-center text-xs text-muted-foreground animate-pulse mt-2">
          Saving draft...
        </p>
      )}
    </motion.form>
  );
}
