/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CoachStats } from '../CoachStats';
import { ActionPlans } from '../ActionPlans';
import { CoachInterface } from '../CoachInterface';

// Mock matchMedia and scrollIntoView globally for JSDOM
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  Element.prototype.scrollIntoView = vi.fn();
});

// Mock Hooks
vi.mock('../../hooks/useCoachDashboard', () => ({
  useCoachDashboard: () => ({
    stats: { streak: 5, conversationCount: 12, insightsCount: 8 },
    recommendations: [
      { id: '1', title: 'Reduce Thermostat', description: 'Lower heating by 1 degree', priority: 'high', estimated_savings: 120, status: 'pending' },
      { id: '2', title: 'Eat Plant-based', description: 'Try vegetarian lunch twice a week', priority: 'medium', estimated_savings: 80, status: 'completed' },
    ],
    updateStatus: vi.fn(),
    deleteRecommendation: vi.fn(),
    createRecommendation: vi.fn(),
    isLoadingStats: false,
    isLoadingRecs: false,
  }),
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
  }),
}));

vi.mock('@/features/gamification/hooks/useBadges', () => ({
  useBadges: () => ({
    allBadges: [],
    earnedSlugs: new Set(),
    totalPoints: 150,
    level: { rank: 2, name: 'Sprout' },
    isLoading: false,
  }),
}));

vi.mock('@/features/coach/hooks/useCoach', () => ({
  useCoach: () => ({
    messages: [
      { id: 'm1', role: 'user', content: 'Hello Coach', createdAt: '2026-06-17T12:00:00Z' },
      { id: 'm2', role: 'assistant', content: 'Hello! I am EcoGuide. How can I help?', createdAt: '2026-06-17T12:00:05Z' },
    ],
    isStreaming: false,
    error: null,
    sendMessage: vi.fn(),
    clearChat: vi.fn(),
    isLoadingHistory: false,
  }),
}));

describe('AI Sustainability Coach accessibility tests', () => {
  describe('CoachStats Widget Accessibility', () => {
    it('renders streak and conversation count with descriptive labels', () => {
      render(<CoachStats />);

      // Verify stats metric card titles
      expect(screen.getByText('Sustainability Streak')).toBeDefined();
      expect(screen.getByText('AI Chats Logged')).toBeDefined();
      expect(screen.getByText('Insights Checklist')).toBeDefined();

      // Verify pending recommendation is shown by default
      expect(screen.getByText('Reduce Thermostat')).toBeDefined();
      expect(screen.queryByText('Eat Plant-based')).toBeNull();

      // Click "Show Completed" to toggle view
      const toggleButton = screen.getByRole('button', { name: 'Show Completed' });
      fireEvent.click(toggleButton);

      // Now completed recommendation should be shown, pending should be hidden
      expect(screen.getByText('Eat Plant-based')).toBeDefined();
      expect(screen.queryByText('Reduce Thermostat')).toBeNull();
    });

    it('displays priorities and savings with screen-reader friendly formats', () => {
      render(<CoachStats />);
      
      expect(screen.getByText('high priority')).toBeDefined();
      expect(screen.getByText('120 kg/yr')).toBeDefined();
    });
  });

  describe('ActionPlans Workspace Accessibility', () => {
    it('renders template options with interactive request buttons', () => {
      render(<ActionPlans onSelectPrompt={vi.fn()} isStreaming={false} />);

      // Verify all three Action Plan templates are shown
      expect(screen.getByText('7-Day Kickstart Plan')).toBeDefined();
      expect(screen.getByText('30-Day Habit Shift Plan')).toBeDefined();
      expect(screen.getByText('90-Day Transition Plan')).toBeDefined();

      // Verify action buttons have accessible titles/labels
      const buttons = screen.getAllByRole('button', { name: 'Request Plan' });
      expect(buttons).toHaveLength(3);
    });
  });

  describe('CoachInterface Workspace Accessibility', () => {
    it('renders chat message history with screen-reader markup', () => {
      render(<CoachInterface />);

      // Verify messages are rendered
      expect(screen.getByText('Hello Coach')).toBeDefined();
      expect(screen.getByText('Hello! I am EcoGuide. How can I help?')).toBeDefined();

      // Verify role labels for assistive technologies (aria-label/sr-only labels)
      expect(screen.getByText('Message from user')).toBeDefined();
      expect(screen.getByText('Message from EcoGuide AI')).toBeDefined();
    });

    it('renders keyboard focusable input and submit buttons', () => {
      render(<CoachInterface />);

      const textInput = screen.getByPlaceholderText('Ask a question about your carbon footprint...');
      expect(textInput).toBeDefined();

      const sendButton = screen.getByLabelText('Send message to EcoGuide coach');
      expect(sendButton).toBeDefined();
      expect(sendButton.getAttribute('type')).toBe('submit');
    });
  });
});
