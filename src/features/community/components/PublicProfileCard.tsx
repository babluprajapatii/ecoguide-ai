'use client';

import { useEffect, useState, useRef } from 'react';
import type { PublicProfile } from '../types/community.types';
import { BADGE_MAP } from '@/features/gamification/data/badges';
import type { BadgeSlug } from '@/features/gamification/types/gamification.types';
import Image from 'next/image';

interface PublicProfileCardProps {
  userId: string;
  onClose?: () => void;
}

export default function PublicProfileCard({ userId, onClose }: PublicProfileCardProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/community/profile/${userId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('This user profile is private or does not exist.');
          }
          throw new Error('Failed to load user profile.');
        }
        const data = await res.json();
        if (active) {
          setProfile(data);
        }
      } catch (err: unknown) {
        if (active) {
          const errMsg = err instanceof Error ? err.message : 'An error occurred.';
          setError(errMsg);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [userId]);

  // Handle click outside modal content to close it
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  // Focus trap, Escape close, and Focus return
  useEffect(() => {
    const activeElement = document.activeElement as HTMLElement | null;

    // Small delay to allow element rendering
    const timer = setTimeout(() => {
      const focusables = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusables?.[0] as HTMLElement | null;
      first?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ) as HTMLElement[];

        if (focusables.length === 0) return;

        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (activeElement) {
        activeElement.focus();
      }
    };
  }, [onClose]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl transition-transform dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close profile details"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {isLoading ? (
          <div className="flex animate-pulse flex-col items-center justify-center space-y-4 p-8">
            <div className="h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-6 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-full space-y-2 pt-4">
              <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ) : error || !profile ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0-6v.01M20.52 17.525L13.8 6.32a2 2 0 00-3.6 0L3.48 17.525A2 2 0 005.28 20.5h13.44a2 2 0 001.8-2.975z"
                />
              </svg>
            </div>
            <h3 id="profile-title" className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              Profile Unavailable
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {error || 'This user profile is private or does not exist.'}
            </p>
            {onClose && (
              <button
                onClick={onClose}
                className="mt-6 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Close Window
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Header Banner */}
            <div className="h-24 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-sky-500/20 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-sky-500/10" />

            <div className="relative flex flex-col items-center px-6 pb-6 text-center">
              {/* Avatar */}
              <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow-lg dark:border-zinc-900 dark:bg-zinc-800">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={`${profile.displayName}'s avatar`}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-zinc-400 dark:text-zinc-500">
                    {profile.displayName.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Title & Level */}
              <h2
                id="profile-title"
                className="mt-3 text-xl font-bold text-zinc-800 dark:text-zinc-100"
              >
                {profile.displayName}
              </h2>

              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Level {profile.level}: {profile.levelName}
                </span>
                {profile.rank && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    Rank #{profile.rank}
                  </span>
                )}
              </div>

              {/* Bio */}
              <div className="my-4 w-full border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
                <p className="text-sm italic text-zinc-600 dark:text-zinc-300">
                  {profile.bio || 'This member has not written a bio yet.'}
                </p>
              </div>

              {/* Streak */}
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
                <svg
                  className="h-4 w-4 animate-pulse text-amber-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Longest Active Streak: {profile.longestStreak} Days
              </div>

              {/* Earned Badges */}
              <div className="w-full text-left">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Earned Badges ({profile.badgeSlugs.length})
                </h3>

                {profile.badgeSlugs.length === 0 ? (
                  <p className="text-sm italic text-zinc-400 dark:text-zinc-600">
                    No badges earned yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-4" role="list" aria-label="Earned badges">
                    {profile.badgeSlugs.map((slug) => {
                      const badge = BADGE_MAP.get(slug as BadgeSlug);
                      if (!badge) return null;
                      return (
                        <div
                          key={slug}
                          role="listitem"
                          className="group relative flex cursor-pointer flex-col items-center text-center"
                        >
                          <div
                            aria-label={`Badge: ${badge.name}. Criteria: ${badge.description}`}
                            className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 text-2xl transition-transform hover:scale-105 dark:border-zinc-700/50 dark:bg-zinc-800"
                          >
                            {badge.icon}
                          </div>

                          {/* Tooltip */}
                          <div className="pointer-events-none absolute bottom-full z-20 mb-2 hidden w-48 rounded-lg bg-zinc-950 p-2 text-center text-xs text-white shadow-xl group-hover:block">
                            <p className="font-bold">{badge.name}</p>
                            <p className="mt-0.5 text-[10px] text-zinc-400">{badge.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
