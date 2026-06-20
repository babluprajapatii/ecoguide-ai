'use client';

import { useState, useEffect } from 'react';
import { useCommunitySettings } from '../hooks/useCommunitySettings';

export default function CommunitySettingsPanel() {
  const { settings, isLoading, isSaving, error, updateSettings } = useCommunitySettings();
  const [optIn, setOptIn] = useState(false);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'hidden'>('public');
  const [bio, setBio] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setOptIn(settings.optIn);
      setLeaderboardOptIn(settings.leaderboardOptIn);
      setVisibility(settings.publicProfileVisibility);
      setBio(settings.bio || '');
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      await updateSettings({
        optIn,
        leaderboardOptIn,
        publicProfileVisibility: visibility,
        bio,
      });
      setMessage({ type: 'success', text: 'Community preferences updated successfully!' });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update preferences.';
      setMessage({ type: 'error', text: errMsg });
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-24 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-1 text-lg font-bold text-zinc-800 dark:text-zinc-100">
        Community & Privacy Preferences
      </h2>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Configure how you participate in the community challenges and leaderboard.
      </p>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {message && (
        <div
          className={`mb-6 rounded-xl border p-4 text-sm ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
              : 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Opt-In general */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <label
              htmlFor="opt-in-toggle"
              className="cursor-pointer text-sm font-semibold text-zinc-700 dark:text-zinc-200"
            >
              Join Eco Community
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Participate in global sustainable goals, challenges, and analytics.
            </p>
          </div>
          <button
            type="button"
            id="opt-in-toggle"
            role="switch"
            aria-checked={optIn}
            onClick={() => setOptIn(!optIn)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              optIn ? 'bg-emerald-600' : 'bg-zinc-200 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                optIn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Leaderboard Opt-In */}
        {optIn && (
          <div className="flex items-start justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
            <div className="space-y-0.5">
              <label
                htmlFor="leaderboard-toggle"
                className="cursor-pointer text-sm font-semibold text-zinc-700 dark:text-zinc-200"
              >
                Leaderboard Rankings
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Show your level, XP, and active streak on the global rankings.
              </p>
            </div>
            <button
              type="button"
              id="leaderboard-toggle"
              role="switch"
              aria-checked={leaderboardOptIn}
              onClick={() => setLeaderboardOptIn(!leaderboardOptIn)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                leaderboardOptIn ? 'bg-emerald-600' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  leaderboardOptIn ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* Public Profile Visibility */}
        {optIn && (
          <div className="space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
            <label
              htmlFor="profile-visibility"
              className="text-sm font-semibold text-zinc-700 dark:text-zinc-200"
            >
              Profile Visibility
            </label>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Control whether other users can view your public badge showcase.
            </p>
            <select
              id="profile-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'public' | 'hidden')}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <option value="public">Public (Everyone can see showcase)</option>
              <option value="hidden">Hidden (Only you can see showcase)</option>
            </select>
          </div>
        )}

        {/* Bio Text area */}
        {optIn && (
          <div className="space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label
                htmlFor="profile-bio"
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-200"
              >
                Community Bio
              </label>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{bio.length}/200</span>
            </div>
            <textarea
              id="profile-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              placeholder="Tell other eco members about your sustainability journey..."
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm placeholder-zinc-400 focus:border-emerald-500 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="flex w-full items-center justify-center rounded-xl border border-transparent bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSaving ? 'Saving Changes...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
}
