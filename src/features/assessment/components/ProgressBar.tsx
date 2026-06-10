'use client';

import { cn } from '@/shared/utils/cn';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: readonly string[];
}

/**
 * Accessible progress bar for the assessment wizard.
 *
 * Renders an ARIA-compliant progressbar with labeled steps.
 * Completed steps are highlighted, current step is indicated.
 *
 * @param props - Current step index, total steps, and labels.
 */
export function ProgressBar({ currentStep, totalSteps, stepLabels }: ProgressBarProps) {
  const percentage = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className="mb-8 w-full">
      <div
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
        className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between">
        {stepLabels.map((label, index) => (
          <span
            key={label}
            className={cn(
              'text-xs font-medium transition-colors',
              index <= currentStep ? 'text-primary' : 'text-muted-foreground',
              index === currentStep && 'font-bold',
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
