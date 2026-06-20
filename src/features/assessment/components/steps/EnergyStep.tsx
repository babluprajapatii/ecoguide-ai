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
  const [electricityKwhPerMonth, setElectricityKwhPerMonth] = useState(
    initialData.electricityKwhPerMonth,
  );
  const [gasKwhPerMonth, setGasKwhPerMonth] = useState(initialData.gasKwhPerMonth);
  const [renewableEnergyPercent, setRenewableEnergyPercent] = useState(
    initialData.renewableEnergyPercent || 0,
  );
  const [homeSizeSqFt, setHomeSizeSqFt] = useState(initialData.homeSizeSqFt || 0);
  const [householdMembers, setHouseholdMembers] = useState(initialData.householdMembers || 1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        <h2 className="text-xl font-bold text-foreground">Home Energy</h2>
        <p className="text-sm text-muted-foreground">
          Enter your average monthly energy usage and household information.
        </p>
      </div>

      <div className="space-y-4 text-sm font-normal">
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
              onChange={(e) => {
                setElectricityKwhPerMonth(Number(e.target.value));
                setFieldErrors((prev) => ({ ...prev, electricityKwhPerMonth: '' }));
              }}
              aria-invalid={!!fieldErrors.electricityKwhPerMonth}
              aria-describedby={
                fieldErrors.electricityKwhPerMonth ? 'electricity-error' : undefined
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {fieldErrors.electricityKwhPerMonth && (
              <p id="electricity-error" className="mt-1 text-xs text-destructive" role="alert">
                {fieldErrors.electricityKwhPerMonth}
              </p>
            )}
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
              onChange={(e) => {
                setGasKwhPerMonth(Number(e.target.value));
                setFieldErrors((prev) => ({ ...prev, gasKwhPerMonth: '' }));
              }}
              aria-invalid={!!fieldErrors.gasKwhPerMonth}
              aria-describedby={fieldErrors.gasKwhPerMonth ? 'gas-error' : undefined}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {fieldErrors.gasKwhPerMonth && (
              <p id="gas-error" className="mt-1 text-xs text-destructive" role="alert">
                {fieldErrors.gasKwhPerMonth}
              </p>
            )}
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
              onChange={(e) => {
                setRenewableEnergyPercent(Number(e.target.value));
                setFieldErrors((prev) => ({ ...prev, renewableEnergyPercent: '' }));
              }}
              aria-invalid={!!fieldErrors.renewableEnergyPercent}
              aria-describedby={fieldErrors.renewableEnergyPercent ? 'renewable-error' : undefined}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {fieldErrors.renewableEnergyPercent && (
              <p id="renewable-error" className="mt-1 text-xs text-destructive" role="alert">
                {fieldErrors.renewableEnergyPercent}
              </p>
            )}
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
              onChange={(e) => {
                setHomeSizeSqFt(Number(e.target.value));
                setFieldErrors((prev) => ({ ...prev, homeSizeSqFt: '' }));
              }}
              aria-invalid={!!fieldErrors.homeSizeSqFt}
              aria-describedby={fieldErrors.homeSizeSqFt ? 'homeSize-error' : undefined}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {fieldErrors.homeSizeSqFt && (
              <p id="homeSize-error" className="mt-1 text-xs text-destructive" role="alert">
                {fieldErrors.homeSizeSqFt}
              </p>
            )}
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
              onChange={(e) => {
                setHouseholdMembers(Number(e.target.value));
                setFieldErrors((prev) => ({ ...prev, householdMembers: '' }));
              }}
              aria-invalid={!!fieldErrors.householdMembers}
              aria-describedby={fieldErrors.householdMembers ? 'members-error' : undefined}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {fieldErrors.householdMembers && (
              <p id="members-error" className="mt-1 text-xs text-destructive" role="alert">
                {fieldErrors.householdMembers}
              </p>
            )}
          </div>
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
