'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CommunitySettings } from '../types/community.types';
import type { CommunitySettingsInput } from '../schemas/community.schemas';

export function useCommunitySettings() {
  const [settings, setSettings] = useState<CommunitySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/community/settings');
      if (!res.ok) {
        throw new Error(`Failed to fetch settings: ${res.statusText}`);
      }
      const data = await res.json();
      setSettings(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred while loading settings';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = async (newSettings: CommunitySettingsInput) => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/community/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) {
        throw new Error(`Failed to update settings: ${res.statusText}`);
      }

      const data = await res.json();
      setSettings(data);
      return data;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred while saving settings';
      setError(errMsg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    updateSettings,
    refresh: fetchSettings,
  };
}
