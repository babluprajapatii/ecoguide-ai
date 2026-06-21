'use client';

import { useState, useEffect, useRef } from 'react';
import { useGoals } from '../hooks/useGoals';
import type { Goal } from '../hooks/useGoals';
import { Target, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AsyncBoundary } from '@/shared/components/AsyncBoundary';

export function GoalsWidget() {
  const { goals, isLoading, createGoal, updateGoal, deleteGoal, createError } = useGoals();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<
    'total' | 'transport' | 'energy' | 'diet' | 'shopping' | 'travel'
  >('total');
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
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

  return (
    <AsyncBoundary isLoading={isLoading}>
      <div className="space-y-4 rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Target size={16} className="text-emerald-500" />
            <span>Active Sustainability Goals</span>
          </h3>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400"
          >
            <Plus size={14} />
            <span>Add Goal</span>
          </button>
        </div>

        <div className="max-h-[320px] space-y-4 overflow-y-auto pr-1">
          {goals.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No active sustainability goals. Click Add Goal to create one!
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-xl border border-border/30 bg-muted/10 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{goal.title}</p>
                      <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">
                        Category: {goal.category}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteGoal(goal.id)}
                      className="rounded p-1 text-stone-500 transition-colors hover:text-red-500"
                      aria-label={`Delete goal: ${goal.title}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between text-[10px] font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {goal.current_value} / {goal.target_value} {goal.unit}
                        </span>
                        <span className="text-muted-foreground">
                          {Math.round((goal.current_value / goal.target_value) * 100)}% Complete
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                        <div
                          role="progressbar"
                          aria-valuenow={Math.round((goal.current_value / goal.target_value) * 100)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Progress for: ${goal.title}`}
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${(goal.current_value / goal.target_value) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void handleDecrement(goal)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-border/60 bg-card text-xs font-bold text-foreground transition-colors hover:bg-accent"
                        aria-label="Decrease current value"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleIncrement(goal)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-border/60 bg-card text-xs font-bold text-foreground transition-colors hover:bg-accent"
                        aria-label="Increase current value"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/60 p-4 backdrop-blur-sm">
              <button
                type="button"
                aria-label="Close dialog overlay"
                className="fixed inset-0 cursor-default"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="relative w-full max-w-sm rounded-2xl border border-border/80 bg-card p-6 shadow-2xl backdrop-blur-md"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h4 id="modal-title" className="text-xs font-bold text-foreground">
                    Create New Sustainability Goal
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground outline-none hover:text-foreground"
                    aria-label="Close dialog"
                  >
                    <X size={15} />
                  </button>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
                  {validationError && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 text-[10px] text-red-500">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {createError && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 text-[10px] text-red-500">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{createError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="goal-title" className="text-[10px] font-bold text-stone-400">
                      Goal Title
                    </label>
                    <input
                      id="goal-title"
                      type="text"
                      placeholder="e.g. Reduce daily shower time"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-lg border border-border bg-dark-900 px-3 py-1.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="goal-category"
                        className="text-[10px] font-bold text-stone-400"
                      >
                        Category
                      </label>
                      <select
                        id="goal-category"
                        value={category}
                        onChange={(e) =>
                          setCategory(
                            e.target.value as
                              | 'total'
                              | 'transport'
                              | 'energy'
                              | 'diet'
                              | 'shopping'
                              | 'travel',
                          )
                        }
                        className="w-full rounded-lg border border-border bg-dark-900 px-3 py-1.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="total">Overall</option>
                        <option value="transport">Transport</option>
                        <option value="energy">Energy</option>
                        <option value="diet">Diet</option>
                        <option value="shopping">Shopping</option>
                        <option value="travel">Travel</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="goal-unit" className="text-[10px] font-bold text-stone-400">
                        Unit
                      </label>
                      <input
                        id="goal-unit"
                        type="text"
                        placeholder="e.g. %, kg, min"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full rounded-lg border border-border bg-dark-900 px-3 py-1.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="goal-target" className="text-[10px] font-bold text-stone-400">
                      Target Value ({unit})
                    </label>
                    <input
                      id="goal-target"
                      type="number"
                      min={1}
                      value={targetValue}
                      onChange={(e) => setTargetValue(Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-dark-900 px-3 py-1.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-3 border-t border-border/60 pt-3">
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
    </AsyncBoundary>
  );
}
