import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LeaderboardClient from '../LeaderboardClient';
import CommunitySettingsPanel from '../CommunitySettingsPanel';

// Mock Hooks
vi.mock('../../hooks/useLeaderboard', () => ({
  useLeaderboard: () => ({
    rankings: [
      {
        rank: 1,
        previousRank: 2,
        rankChange: 1,
        userId: 'user-1',
        displayName: 'Eco Hero',
        totalPoints: 1200,
        level: 4,
        levelName: 'Carbon Reducer',
        badgeCount: 5,
        longestStreak: 10,
        isCurrentUser: true,
      },
    ],
    currentUser: { isOptedIn: true, rank: 1, totalPoints: 1200, level: 4 },
    pagination: { page: 1, limit: 20, totalEntries: 1, totalPages: 1 },
    isLoading: false,
    error: null,
    page: 1,
    setPage: vi.fn(),
    view: 'global',
    setView: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('../../hooks/useCommunityStats', () => ({
  useCommunityStats: () => ({
    stats: {
      totalUsers: 15,
      activeUsers7d: 8,
      totalXpEarned: 15000,
      assessmentsCompleted: 12,
      simulationsSaved: 6,
      badgesEarned: 9,
      avgCarbonFootprint: 14.5,
      topCarbonSaver: { userId: 'u-1', displayName: 'Saver', value: 8.5 },
      mostImprovedUser: { userId: 'u-2', displayName: 'Improved', value: 10 },
      longestStreakUser: { userId: 'u-3', displayName: 'Streaker', value: 12 },
      cachedAt: new Date().toISOString(),
    },
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('../../hooks/useCommunitySettings', () => ({
  useCommunitySettings: () => ({
    settings: {
      optIn: true,
      leaderboardOptIn: true,
      publicProfileVisibility: 'public',
      bio: 'Eco advocate',
    },
    isLoading: false,
    isSaving: false,
    error: null,
    updateSettings: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('Community & Leaderboard Accessibility Tests', () => {
  describe('LeaderboardClient ARIA Structure', () => {
    it('renders a semantic table with a descriptive caption', () => {
      render(<LeaderboardClient />);

      const table = screen.getByRole('table');
      expect(table).toBeDefined();

      const caption = table.querySelector('caption');
      expect(caption).not.toBeNull();
      expect(caption?.textContent).toContain('Community Leaderboard Listings');
    });

    it('defines scope="col" for all header columns', () => {
      render(<LeaderboardClient />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(6);
      headers.forEach((th) => {
        expect(th.getAttribute('scope')).toBe('col');
      });
    });

    it('contains tab list with appropriate roles and selection states', () => {
      render(<LeaderboardClient />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeDefined();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      expect(tabs[0]!.getAttribute('aria-selected')).toBe('true'); // Global view
    });
  });

  describe('CommunitySettingsPanel ARIA Toggle Controls', () => {
    it('uses role="switch" with proper checked attributes for settings toggles', () => {
      render(<CommunitySettingsPanel />);

      const toggles = screen.getAllByRole('switch');
      expect(toggles).toHaveLength(2); // Eco Community and Leaderboard Toggles
      expect(toggles[0]!.getAttribute('aria-checked')).toBe('true');
      expect(toggles[1]!.getAttribute('aria-checked')).toBe('true');
    });
  });
});
