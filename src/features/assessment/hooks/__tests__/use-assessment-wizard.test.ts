import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssessmentWizard } from '../use-assessment-wizard';

describe('useAssessmentWizard hook', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('restores draft state on mount', async () => {
    const mockDraft = {
      inputs: {
        transport: { weeklyKm: 120, fuelType: 'hybrid', publicTransportWeeklyHours: 1, rideShareWeeklyKm: 10 },
        energy: { electricityKwhPerMonth: 100, gasKwhPerMonth: 50, renewableEnergyPercent: 20, homeSizeSqFt: 1200, householdMembers: 2 },
        diet: { dietType: 'vegan' },
        shopping: { level: 'low' },
        travel: { flightsPerYear: 2, avgDistanceKm: 1000, hotelStaysPerYear: 3 },
      },
      currentStep: 'energy',
      draftVersion: 3,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDraft,
    } as unknown as Response);

    const { result } = renderHook(() => useAssessmentWizard());

    // Flush microtasks
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.state.currentStep).toBe('energy');
    expect(result.current.state.transport.weeklyKm).toBe(120);
    expect(result.current.state.energy.householdMembers).toBe(2);
    expect(result.current.state.diet.dietType).toBe('vegan');
  });

  it('debounces autosave network requests', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Draft updated.', draftVersion: 2 }),
    } as unknown as Response);

    const { result } = renderHook(() => useAssessmentWizard());

    // Start by moving to transport step
    act(() => {
      result.current.goToStep('transport');
    });

    act(() => {
      result.current.setTransport({
        weeklyKm: 50,
        fuelType: 'electric',
        publicTransportWeeklyHours: 0,
        rideShareWeeklyKm: 0,
      });
    });

    // Fetch should not have been called immediately due to debounce
    expect(fetch).not.toHaveBeenCalledWith('/api/assessment/draft', expect.any(Object));

    // Advance time by 500ms
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(fetch).toHaveBeenCalledWith('/api/assessment/draft', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('buffers draft to localStorage on network outage', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: false, status: 404 } as unknown as Response) // load draft fails/not found
      .mockRejectedValueOnce(new Error('Network offline')); // save draft fails

    const { result } = renderHook(() => useAssessmentWizard());

    await act(async () => {
      result.current.goToStep('diet');
    });

    act(() => {
      result.current.setDiet({ dietType: 'vegetarian' });
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'ecoguide_assessment_draft',
      expect.stringContaining('"isUnsynced":true')
    );
  });

  it('detects draft conflicts and handles 409', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: false, status: 404 } as unknown as Response)
      .mockResolvedValueOnce({
        status: 409,
        ok: false,
        json: async () => ({ storedVersion: 5 }),
      } as unknown as Response);

    const { result } = renderHook(() => useAssessmentWizard());

    await act(async () => {
      result.current.goToStep('shopping');
    });

    act(() => {
      result.current.setShopping({ level: 'high' });
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // On 409 conflict, version should sync to server version + 1
    expect(result.current.state.draftVersion).toBe(6);
  });
});
