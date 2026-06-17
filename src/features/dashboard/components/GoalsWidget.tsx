'use client';

import { useState, useEffect, useRef } from 'react';
import { useGoals } from '../hooks/useGoals';
import type { Goal } from '../hooks/useGoals';
import { Target, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GoalsWidget() {
  const {
    goals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    createError,
  } = useGoals();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'total' | 'transport' | 'energy' | 'diet' | 'shopping' | 'travel'>('total');
  const [targetValue, setTargetValue] = useState(10);
  const [unit, setUnit] = useState('%');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Refs for focus trapping
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Set focus on open/close
  useEffect(() => {
    if (isOpen) {
      // Find first input and focus it
      const firstInput = modalRef.current?.querySelector('input');
      if (firstInput) {
        (firstInput as HTMLInputElement).focus();
      }
    } else {
      // Return focus to button that opened the modal
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements[focusableElements.length - 1]!;

      if (e.shiftKey) {
        // Shift + Tab -> Wrap from first to last
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab -> Wrap from last to first
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (title.trim().length < 3) {
      setValidationError('Title must be at least 3 characters');
      return;
    }

    if (targetValue <= 0) {
      setValidationError('Target value must be greater than 0');
      return;
    }

    try {
      await createGoal({
        title: title.trim(),
        category,
        target_value: Number(targetValue),
        current_value: 0,
        unit: unit.trim() || '%',
        status: 'in_progress',
      });
      // Clear form and close
      setTitle('');
      setCategory('total');
      setTargetValue(10);
      setUnit('%');
      setIsOpen(false);
    } catch {
      // error is handled by createError in useGoals hook
    }
  };

  const handleIncrement = async (goal: Goal) => {
    const nextVal = Math.min(goal.target_value, goal.current_value + (goal.unit === '%' ? 5 : 50));
    await updateGoal(goal.id, nextVal);
  };

  const handleDecrement = async (goal: Goal) => {
    const nextVal = Math.max(0, goal.current_value - (goal.unit === '%' ? 5 : 50));
    await updateGoal(goal.id, nextVal);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25 animate-pulse h-[300px]" />
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Target size={16} className="text-emerald-500" />
          <span>Active Sustainability Goals</span>
        </h3>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/20"
        >
          <Plus size={14} />
          <span>Add Goal</span>
        </button>
      </div>

      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No active sustainability goals. Click Add Goal to create one!
          </div>
        ) : (
          goals.map((goal) => {
            const progressPct = goal.target_value > 0
              ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
              : 0;

            return (
              <div key={goal.id} className="space-y-2 rounded-xl border border-border/40 bg-card/50 p-4 transition-colors hover:border-emerald-500/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                      {goal.category}
                    </span>
                    <h4 className="text-xs font-bold text-foreground truncate mt-0.5">
                      {goal.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteGoal(goal.id)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    aria-label={`Delete goal: ${goal.title}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Progress bar container with full screen reader attributes */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                    <span>
                      {goal.current_value} / {goal.target_value} {goal.unit}
                    </span>
                    <span className={goal.status === 'completed' ? 'text-emerald-500' : 'text-foreground'}>
                      {progressPct}%
                    </span>
                  </div>
                  <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden">
                    <div
                      role="progressbar"
                      aria-valuenow={progressPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Goal progress for: ${goal.title}`}
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={goal.current_value <= 0}
                    onClick={() => handleDecrement(goal)}
                    className="flex-1 rounded-md border border-border px-2 py-1 text-[10px] font-bold text-foreground hover:bg-accent disabled:opacity-50"
                  >
                    - Reduce
                  </button>
                  <button
                    type="button"
                    disabled={goal.status === 'completed'}
                    onClick={() => handleIncrement(goal)}
                    className="flex-1 rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    + Progress
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal dialog with focus trapping and custom backing overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Content card */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl z-10"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>

              <h3 id="modal-title" className="text-base font-bold text-foreground mb-4">
                Create Sustainability Goal
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="goal-title" className="mb-1 block text-xs font-semibold text-foreground">
                    Goal Title
                  </label>
                  <input
                    id="goal-title"
                    type="text"
                    required
                    placeholder="e.g. Reduce driving, meat-free meals"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="goal-category" className="mb-1 block text-xs font-semibold text-foreground">
                      Category
                    </label>
                    <select
                      id="goal-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as 'total' | 'transport' | 'energy' | 'diet' | 'shopping' | 'travel')}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="total">Overall</option>
                      <option value="transport">Transport</option>
                      <option value="energy">Energy</option>
                      <option value="diet">Diet</option>
                      <option value="shopping">Shopping</option>
                      <option value="travel">Travel</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="goal-unit" className="mb-1 block text-xs font-semibold text-foreground">
                      Progress Unit
                    </label>
                    <input
                      id="goal-unit"
                      type="text"
                      required
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="goal-target" className="mb-1 block text-xs font-semibold text-foreground">
                    Target Goal Value
                  </label>
                  <input
                    id="goal-target"
                    type="number"
                    min={1}
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Form feedback error messages */}
                {(validationError || createError) && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500">
                    <AlertCircle size={14} />
                    <span>{validationError || createError}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 rounded-lg border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600"
                  >
                    Create Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
