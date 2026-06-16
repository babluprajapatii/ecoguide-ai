'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ShoppingInput, ShoppingLevel } from '@/features/assessment/types/assessment.types';
import { shoppingInputSchema } from '@/features/assessment/schemas/assessment.schemas';
import { cn } from '@/shared/utils/cn';

interface ShoppingStepProps {
  initialData: ShoppingInput;
  onNext: (data: ShoppingInput) => void;
  onBack: () => void;
  isSaving?: boolean;
}

const SHOPPING_OPTIONS: { value: ShoppingLevel; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Minimal new purchases, mostly secondhand' },
  { value: 'medium', label: 'Medium', description: 'Average consumer spending habits' },
  { value: 'high', label: 'High', description: 'Frequent new purchases, fast fashion' },
];

export function ShoppingStep({ initialData, onNext, onBack, isSaving }: ShoppingStepProps) {
  const [level, setLevel] = useState<ShoppingLevel>(initialData.level);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = shoppingInputSchema.safeParse({ level });
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? 'Invalid shopping data');
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
        <h2 className="text-xl font-bold text-foreground">Shopping &amp; Consumption</h2>
        <p className="text-sm text-muted-foreground">How would you describe your shopping habits?</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">Shopping intensity</legend>
        {SHOPPING_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            aria-label={opt.label}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
              level === opt.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            )}
          >
            <input
              type="radio"
              name="shoppingLevel"
              value={opt.value}
              checked={level === opt.value}
              onChange={() => setLevel(opt.value)}
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
