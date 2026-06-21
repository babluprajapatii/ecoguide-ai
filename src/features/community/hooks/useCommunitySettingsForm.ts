import { useState, useEffect } from 'react';
import { useCommunitySettings } from './useCommunitySettings';

export function useCommunitySettingsForm() {
  const { settings, isLoading, isSaving, error, updateSettings } = useCommunitySettings();
  const [optIn, setOptIn] = useState(false);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'hidden'>('public');
  const [bio, setBio] = useState('');

  const [message, setMessage] = useState<{
    readonly type: 'success' | 'error';
    readonly text: string;
  } | null>(null);

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

  return {
    optIn,
    setOptIn,
    leaderboardOptIn,
    setLeaderboardOptIn,
    visibility,
    setVisibility,
    bio,
    setBio,
    message,
    setMessage,
    isLoading,
    isSaving,
    error,
    handleSubmit,
  };
}
