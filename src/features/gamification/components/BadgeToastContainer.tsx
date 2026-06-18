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
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4 sm:px-0"
      role="region"
      aria-live="polite"
      aria-label="Badge unlock notifications"
    >
      {toasts.map((toast) => {
        const { badge } = toast;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full items-center gap-3 rounded-xl border border-amber-500/30 bg-card/95 backdrop-blur-md p-4 shadow-2xl animate-in slide-in-from-bottom duration-300 motion-reduce:animate-none focus-within:ring-2 focus-within:ring-primary"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-500">
              <Trophy size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-1 text-xs font-bold text-amber-500 uppercase tracking-wide">
                <Sparkles size={12} className="animate-pulse" />
                Badge Earned
              </p>
              <h4 className="text-sm font-bold text-foreground truncate">{badge.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">{badge.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary shrink-0"
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
