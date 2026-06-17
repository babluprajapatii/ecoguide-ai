/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AchievementsPreview } from '../AchievementsPreview';
import { AnalyticsCharts } from '../AnalyticsCharts';
import type { AssessmentRecord } from '../../types/dashboard.types';

// Mock Auth and Gamification Hooks
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

vi.mock('@/features/gamification/hooks/useBadges', () => ({
  useBadges: () => ({
    allBadges: [
      { slug: 'eco-hero', name: 'Eco Hero', description: 'Be sustainable', pointValue: 100, icon: 'Award' },
    ],
    earnedSlugs: new Set(['eco-hero']),
    totalPoints: 120,
    level: {
      rank: 2,
      name: 'Eco Warrior',
      progress: 0.6,
      maxPoints: 200,
    },
    isLoading: false,
  }),
}));

// Mock Recharts to avoid layout warnings in JSDOM
vi.mock('recharts', async (importOriginal) => {
  const original: any = await importOriginal();
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  };
});

describe('Dashboard Component Accessibility Tests', () => {
  describe('AchievementsPreview Accessibility', () => {
    it('renders level progress bar with correct role and ARIA attributes', () => {
      render(<AchievementsPreview />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeDefined();
      expect(progressbar.getAttribute('aria-valuenow')).toBe('60');
      expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
      expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
      expect(progressbar.getAttribute('aria-label')).toBe('Progress to next level: Eco Warrior');
    });
  });

  describe('AnalyticsCharts Accessibility', () => {
    const mockLatest: AssessmentRecord = {
      id: 'assessment-1',
      user_id: 'test-user-id',
      created_at: '2026-06-17T12:00:00Z',
      transport_kg: 1200,
      diet_kg: 1500,
      energy_kg: 1000,
      shopping_kg: 400,
      travel_kg: 800,
      total_kg: 4900,
      compared_to_average: 1.04,
      percentile: 42,
    };

    const mockHistory = [mockLatest];

    it('renders a screen-reader-only table for Carbon Breakdown in the breakdown view', () => {
      render(
        <AnalyticsCharts
          latestAssessment={mockLatest}
          history={mockHistory}
          targetTotal={2000}
        />
      );

      // Verify that the table is present in the document
      const table = screen.getByText('Carbon Breakdown').closest('table');
      expect(table).not.toBeNull();

      // Verify header columns are present with appropriate text
      const headers = table!.querySelectorAll('th');
      expect(headers[0]?.textContent).toBe('Category');
      expect(headers[1]?.textContent).toBe('Emissions');

      // Verify table data reflects emissions
      const rows = table!.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(5); // Transport, Diet, Energy, Shopping, Travel
      expect(rows[0]?.textContent).toContain('Transport');
      expect(rows[0]?.textContent).toContain('1.2t'); // 1200kg
    });

    it('toggles screen-reader table content when user changes chart views', () => {
      render(
        <AnalyticsCharts
          latestAssessment={mockLatest}
          history={mockHistory}
          targetTotal={2000}
        />
      );

      // Switch to Category Comparison tab
      const comparisonTabButton = screen.getByText('Comparison').closest('button');
      expect(comparisonTabButton).not.toBeNull();
      fireEvent.click(comparisonTabButton!);

      // Verify Category Comparison table is rendered
      const table = screen.getByText('Category Comparison').closest('table');
      expect(table).not.toBeNull();

      const headers = table!.querySelectorAll('th');
      expect(headers[0]?.textContent).toBe('Category');
      expect(headers[1]?.textContent).toBe('Your Emissions');
      expect(headers[2]?.textContent).toBe('Global Average');
    });
  });
});
