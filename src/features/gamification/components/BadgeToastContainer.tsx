'use client';

import { X, Trophy, Sparkles } from 'lucide-react';
import type { BadgeToast } from '../hooks/useBadges';

interface BadgeToastContainerProps {
  readonly toasts: readonly BadgeToast[];
  readonly onDismiss: (id: string) => void;
}

export function BadgeToastContainer({ toasts, onDismiss }: BadgeToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
      role="region"
      aria-live="polite"
      aria-label="Badge unlock notifications"
    >
      {toasts.map((toast) => {
        const { badge } = toast;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full items-center gap-3 rounded-xl border border-amber-500/30 bg-card/95 p-4 shadow-2xl backdrop-blur-md duration-300 animate-in slide-in-from-bottom focus-within:ring-2 focus-within:ring-primary motion-reduce:animate-none"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-500">
              <Trophy size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-amber-500">
                <Sparkles size={12} className="animate-pulse" />
                Badge Earned
              </p>
              <h4 className="truncate text-sm font-bold text-foreground">{badge.name}</h4>
              <p className="line-clamp-1 text-xs text-muted-foreground">{badge.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={`Dismiss notification for ${badge.name}`}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default BadgeToastContainer;
