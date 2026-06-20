/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AchievementsPreview } from '../AchievementsPreview';
import { AnalyticsCharts } from '../AnalyticsCharts';
import type { AssessmentRecord } from '../../types/dashboard.types';

expect.extend(toHaveNoViolations);

// Mock Auth and Gamification Hooks
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

vi.mock('@/features/gamification/hooks/useBadges', () => ({
  useBadges: () => ({
    allBadges: [
      {
        slug: 'eco-hero',
        name: 'Eco Hero',
        description: 'Be sustainable',
        pointValue: 100,
        icon: 'Award',
      },
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
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

describe('AchievementsPreview Axe Validation', () => {
  it('should have no axe violations', async () => {
    const { container } = render(<AchievementsPreview />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('AnalyticsCharts Axe Validation', () => {
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

  it('should have no axe violations in default view', async () => {
    const { container } = render(
      <AnalyticsCharts latestAssessment={mockLatest} history={mockHistory} targetTotal={2000} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
