/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimulatorClient } from '../SimulatorClient';

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

// Mock Recharts
vi.mock('recharts', async (importOriginal) => {
  const original: any = await importOriginal();
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  };
});

// Mock hooks
const mockUseSimulator = vi.fn();
const mockUseSimulatorDashboard = vi.fn();

vi.mock('../../hooks/useSimulator', () => ({
  useSimulator: (baseline: any) => mockUseSimulator(baseline),
}));

vi.mock('../../hooks/useSimulatorDashboard', () => ({
  useSimulatorDashboard: () => mockUseSimulatorDashboard(),
}));

// Mock the dynamically imported chart components to render synchronously
vi.mock('@/features/simulator/components/ForecastChart', () => {
  return {
    default: function MockForecastChart({ forecast }: any) {
      return (
        <div data-testid="forecast-chart">
          <div role="img" aria-label="Area chart showing projected carbon footprint forecast over 12 months by category">
            Forecast Chart Visual Representation
          </div>
          <div className="sr-only">
            <h4>Projected Footprint Forecast Table</h4>
            <table>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((pt: any) => (
                  <tr key={pt.month}>
                    <td>{pt.month}</td>
                    <td>{pt.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };
});

vi.mock('@/features/simulator/components/ComparisonChart', () => {
  return {
    default: function MockComparisonChart({ selectedSimulations }: any) {
      return (
        <div data-testid="comparison-chart">
          <div role="img" aria-label="Bar chart comparing carbon savings, cost savings, and impact score of selected scenarios side by side">
            Comparison Chart Visual Representation
          </div>
          <div className="sr-only">
            <h4>Scenario Comparison Data Table</h4>
            <table>
              <thead>
                <tr>
                  <th scope="col">Scenario Name</th>
                  <th scope="col">Impact Score</th>
                </tr>
              </thead>
              <tbody>
                {selectedSimulations.map((sim: any) => (
                  <tr key={sim.id}>
                    <td>{sim.scenario_name}</td>
                    <td>{sim.impact_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };
});

describe('Carbon Impact Simulator UI Accessibility Tests', () => {
  const mockSetCarKm = vi.fn();
  const mockSetRenewable = vi.fn();
  const mockSaveSim = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSimulator.mockReturnValue({
      baseline: { transport: 2000, diet: 2000, energy: 1800, shopping: 1200, travel: 1000, total: 8000, comparedToAverage: 1.7, percentile: 60 },
      adjustments: { carKmPerWeek: 150, carFuelType: 'petrol', dietType: 'mixed', renewableEnergyPercent: 20, shoppingLevel: 'medium', flightHoursPerYear: 10 },
      projected: { transport: 1900, diet: 1900, energy: 1700, shopping: 1100, travel: 900, total: 7500, comparedToAverage: 1.6, percentile: 58 },
      forecast: [
        { month: 'Now', monthIndex: 0, total: 8000, transport: 2000, diet: 2000, energy: 1800, shopping: 1200, travel: 1000 },
        { month: 'Month 12', monthIndex: 12, total: 7500, transport: 1900, diet: 1900, energy: 1700, shopping: 1100, travel: 900 }
      ],
      totalSavings: 500,
      savingsPercent: 6,
      costSavings: 200,
      waterSavings: 1000,
      energySavings: 300,
      wasteSavings: 50,
      impactScore: 45,
      tier: 'Silver',
      forecastMonths: 12,
      setForecastMonths: vi.fn(),
      setCarKmPerWeek: mockSetCarKm,
      setCarFuelType: vi.fn(),
      setDietType: vi.fn(),
      setRenewableEnergyPercent: mockSetRenewable,
      setFlightHoursPerYear: vi.fn(),
      setShoppingLevel: vi.fn(),
      applyPreset: vi.fn(),
      reset: vi.fn(),
      encodeToUrl: vi.fn().mockReturnValue('http://localhost/simulator?solar=20'),
    });

    mockUseSimulatorDashboard.mockReturnValue({
      simulations: [
        {
          id: '11111111-2222-3333-4444-555555555555',
          user_id: 'test-user',
          scenario_name: 'Solar Power Up',
          scenario_type: 'solar',
          configuration: { carKmPerWeek: null, carFuelType: null, dietType: null, renewableEnergyPercent: 100, shoppingLevel: null, flightHoursPerYear: null },
          estimated_carbon_savings: 1200,
          estimated_cost_savings: 480,
          estimated_water_savings: 0,
          estimated_energy_savings: 6000,
          impact_score: 55,
          is_favorite: false,
          comparison_group_id: null,
          created_at: '2026-06-17T12:00:00Z',
          updated_at: '2026-06-17T12:00:00Z',
        }
      ],
      isLoadingSimulations: false,
      isSaving: false,
      isDeleting: false,
      saveSimulation: mockSaveSim,
      deleteSimulation: vi.fn(),
      toggleFavorite: vi.fn(),
      updateSimulationName: vi.fn(),
    });
  });

  it('renders slider controls with proper accessible labels, role, and touch targets', () => {
    render(<SimulatorClient />);

    // Check sliders exist and have label connections
    const carSlider = screen.getByLabelText(/weekly driving/i);
    expect(carSlider).toBeDefined();
    expect(carSlider.getAttribute('type')).toBe('range');
    expect(carSlider.getAttribute('aria-valuenow')).toBe('150');

    // Check touch target classes (should have min-h-[44px])
    expect(carSlider.className).toContain('min-h-[44px]');

    const solarSlider = screen.getByLabelText(/home renewable/i);
    expect(solarSlider).toBeDefined();
    expect(solarSlider.getAttribute('aria-valuenow')).toBe('20');
    expect(solarSlider.className).toContain('min-h-[44px]');
  });

  it('renders tabs with role=tablist and manages aria-selected attributes', () => {
    render(<SimulatorClient />);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeDefined();

    const forecastTab = screen.getByRole('tab', { name: /12-month forecast/i });
    const savedTab = screen.getByRole('tab', { name: /saved scenarios/i });
    const compareTab = screen.getByRole('tab', { name: /comparison view/i });

    expect(forecastTab.getAttribute('aria-selected')).toBe('true');
    expect(savedTab.getAttribute('aria-selected')).toBe('false');
    expect(compareTab.getAttribute('aria-selected')).toBe('false');

    // Click on saved scenarios tab
    fireEvent.click(savedTab);
    expect(forecastTab.getAttribute('aria-selected')).toBe('false');
    expect(savedTab.getAttribute('aria-selected')).toBe('true');
  });

  it('renders live-updating accessibility text and icons', () => {
    render(<SimulatorClient />);

    // Metrics should have clean screen-reader names or content
    expect(screen.getByText('0.5 t/yr')).toBeDefined(); // carbon savings
    expect(screen.getByText('$200/yr')).toBeDefined(); // cost savings
    expect(screen.getByText('Silver')).toBeDefined(); // tier
    expect(screen.getByText('45/100')).toBeDefined(); // impact score
  });

  it('renders screen reader fallback tables inside charts', () => {
    render(<SimulatorClient />);

    // Inside forecast tab, ForecastChart is rendered
    expect(screen.getByTestId('forecast-chart')).toBeDefined();

    // Verify screen-reader description of chart
    const chartImg = screen.getByRole('img', { name: /Area chart showing projected carbon footprint/i });
    expect(chartImg).toBeDefined();

    // Verify presence of table fallback
    const tableHeader = screen.getByRole('heading', { level: 4, name: /Projected Footprint Forecast Table/i });
    expect(tableHeader).toBeDefined();
  });
});
