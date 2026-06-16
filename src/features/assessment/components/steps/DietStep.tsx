'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { DietInput, DietType } from '@/features/assessment/types/assessment.types';
import { dietInputSchema } from '@/features/assessment/schemas/assessment.schemas';
import { cn } from '@/shared/utils/cn';

interface DietStepProps {
  initialData: DietInput;
  onNext: (data: DietInput) => void;
  onBack: () => void;
  isSaving?: boolean;
}

const DIET_OPTIONS: { value: DietType; label: string; description: string }[] = [
  { value: 'vegan', label: 'Vegan', description: 'No animal products' },
  { value: 'vegetarian', label: 'Vegetarian', description: 'No meat, includes dairy & eggs' },
  { value: 'mixed', label: 'Mixed', description: 'Balanced diet with some meat' },
  { value: 'meat-heavy', label: 'Meat-Heavy', description: 'Meat with most meals' },
];

export function DietStep({ initialData, onNext, onBack, isSaving }: DietStepProps) {
  const [dietType, setDietType] = useState<DietType>(initialData.dietType);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = dietInputSchema.safeParse({ dietType });
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? 'Invalid diet data');
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
        <h2 className="text-xl font-bold text-foreground">Dietary Pattern</h2>
        <p className="text-sm text-muted-foreground">Select the option that best describes your typical diet.</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">Dietary pattern</legend>
        {DIET_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            aria-label={opt.label}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
              dietType === opt.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            )}
          >
            <input
              type="radio"
              name="dietType"
              value={opt.value}
              checked={dietType === opt.value}
              onChange={() => setDietType(opt.value)}
              className="h-4 w-4 border-border text-primary"
            />
            <div>
              <span className="block text-sm font-medium text-foreground">{opt.label}</span>
              <span className="block text-xs text-muted-foreground">{opt.description}</span>
            </div>
          </label>
        ))}
      </fieldset>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
          Back
        </button>
        <button type="submit" className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
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
