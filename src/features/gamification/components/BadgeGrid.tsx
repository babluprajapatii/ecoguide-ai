'use client';

/**
 * BadgeGrid — displays all 10 badges in an accessible, keyboard-navigable grid.
 *
 * Earned badges show in full color; unearned badges appear in grayscale
 * with a lock overlay. Clicking a badge opens a detail modal.
 *
 * Accessibility:
 * - Grid uses roving tabIndex for arrow-key navigation.
 * - Each badge has a descriptive aria-label.
 * - Modal uses role="dialog", aria-modal, and focus trapping.
 *
 * @module BadgeGrid
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import type { FC, KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  ClipboardCheck,
  TrendingDown,
  Flame,
  Leaf,
  Trophy,
  Bike,
  Sun,
  Share2,
  MessageCircle,
  Award,
  Lock,
  X,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { BadgeDefinition, BadgeSlug } from '@/features/gamification/types/gamification.types';

// ---------------------------------------------------------------------------
// Icon map — maps icon name strings to Lucide components
// ---------------------------------------------------------------------------

type LucideComponent = FC<LucideProps>;

const ICON_MAP: Record<string, LucideComponent> = {
  ClipboardCheck,
  TrendingDown,
  Flame,
  Leaf,
  Trophy,
  Bike,
  Sun,
  Share2,
  MessageCircle,
  Award,
};

function BadgeIcon({ iconName, className }: { readonly iconName: string; readonly className?: string }) {
  const IconComponent = ICON_MAP[iconName];
  if (!IconComponent) return null;
  return <IconComponent className={className} size={28} strokeWidth={1.8} />;
}

// ---------------------------------------------------------------------------
// Badge Detail Modal
// ---------------------------------------------------------------------------

interface BadgeModalProps {
  readonly badge: BadgeDefinition;
  readonly isEarned: boolean;
  readonly earnedAt: string | null;
  readonly onClose: () => void;
}

function BadgeModal({ badge, isEarned, earnedAt, onClose }: BadgeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the close button on mount
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Trap focus and handle Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (!firstEl || !lastEl) return;

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-modal-title"
        aria-describedby="badge-modal-description"
        className="relative mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close badge details"
        >
          <X size={18} />
        </button>

        {/* Badge icon */}
        <div className="flex justify-center">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl ${
              isEarned
                ? 'bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-500'
                : 'bg-muted text-muted-foreground grayscale'
            }`}
          >
            <BadgeIcon iconName={badge.icon} className={isEarned ? '' : 'opacity-40'} />
          </div>
        </div>

        {/* Badge info */}
        <h2
          id="badge-modal-title"
          className="mt-4 text-center text-lg font-bold text-foreground"
        >
          {badge.name}
        </h2>
        <p
          id="badge-modal-description"
          className="mt-1 text-center text-sm text-muted-foreground"
        >
          {badge.description}
        </p>

        {/* Criteria */}
        <div className="mt-4 rounded-xl bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">How to earn</p>
          <p className="mt-0.5 text-sm text-foreground">{badge.criteria}</p>
        </div>

        {/* Points & Status */}
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            +{badge.pointValue} pts
          </span>
          {isEarned ? (
            <span className="text-xs font-medium text-emerald-500">
              ✓ Earned {earnedAt ? new Date(earnedAt).toLocaleDateString() : ''}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock size={12} />
              Not yet earned
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge Card
// ---------------------------------------------------------------------------

interface BadgeCardProps {
  readonly badge: BadgeDefinition;
  readonly isEarned: boolean;
  readonly tabIndex: number;
  readonly onSelect: () => void;
  readonly onKeyNavigation: (e: ReactKeyboardEvent, index: number) => void;
  readonly index: number;
}

const BadgeCard = memo(function BadgeCard({
  badge,
  isEarned,
  tabIndex,
  onSelect,
  onKeyNavigation,
  index,
}: BadgeCardProps) {
  const statusText = isEarned ? 'Earned' : 'Not yet earned';

  return (
    <button
      type="button"
      onClick={onSelect}
      onKeyDown={(e) => onKeyNavigation(e, index)}
      tabIndex={tabIndex}
      className={`group relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        isEarned
          ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-500/10'
          : 'border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm'
      }`}
      aria-label={`${badge.name}. ${statusText}. ${badge.description}`}
    >
      {/* Icon container */}
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
          isEarned
            ? 'bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-500'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isEarned ? (
          <BadgeIcon iconName={badge.icon} />
        ) : (
          <div className="relative">
            <BadgeIcon iconName={badge.icon} className="opacity-30 grayscale" />
            <Lock
              size={14}
              className="absolute -bottom-1 -right-1 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Name */}
      <span
        className={`text-xs font-semibold leading-tight ${
          isEarned ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {badge.name}
      </span>

      {/* Points pill */}
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
          isEarned
            ? 'bg-emerald-500/10 text-emerald-500'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {badge.pointValue} pts
      </span>
    </button>
  );
});

// ---------------------------------------------------------------------------
// BadgeGrid
// ---------------------------------------------------------------------------

interface BadgeGridProps {
  readonly badges: readonly BadgeDefinition[];
  readonly earnedSlugs: ReadonlySet<BadgeSlug>;
  readonly earnedBadgeMap?: ReadonlyMap<BadgeSlug, string>; // slug → earnedAt
}

export function BadgeGrid({ badges, earnedSlugs, earnedBadgeMap }: BadgeGridProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((badge: BadgeDefinition) => {
    setSelectedBadge(badge);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedBadge(null);
    // Return focus to the grid
    const buttons = gridRef.current?.querySelectorAll<HTMLButtonElement>('button');
    buttons?.[focusedIndex]?.focus();
  }, [focusedIndex]);

  const handleKeyNavigation = useCallback(
    (e: ReactKeyboardEvent, index: number) => {
      const cols = window.innerWidth >= 768 ? 5 : window.innerWidth >= 640 ? 3 : 2;
      let nextIndex = index;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = Math.min(index + 1, badges.length - 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = Math.max(index - 1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = Math.min(index + cols, badges.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = Math.max(index - cols, 0);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleSelect(badges[index]!);
          return;
        default:
          return;
      }

      setFocusedIndex(nextIndex);
      const buttons = gridRef.current?.querySelectorAll<HTMLButtonElement>('button');
      buttons?.[nextIndex]?.focus();
    },
    [badges, handleSelect],
  );

  return (
    <>
      <div
        ref={gridRef}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
        role="grid"
        aria-label="Achievement badges"
      >
        {badges.map((badge, i) => (
          <BadgeCard
            key={badge.slug}
            badge={badge}
            isEarned={earnedSlugs.has(badge.slug)}
            tabIndex={i === focusedIndex ? 0 : -1}
            onSelect={() => handleSelect(badge)}
            onKeyNavigation={handleKeyNavigation}
            index={i}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {selectedBadge && (
        <BadgeModal
          badge={selectedBadge}
          isEarned={earnedSlugs.has(selectedBadge.slug)}
          earnedAt={earnedBadgeMap?.get(selectedBadge.slug) ?? null}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

export default BadgeGrid;
