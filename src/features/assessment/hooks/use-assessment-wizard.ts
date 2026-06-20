'use client';

import { useCallback, useReducer, useEffect, useRef } from 'react';
import type {
  WizardState,
  WizardAction,
  WizardStep,
  TransportInput,
  DietInput,
  EnergyInput,
  ShoppingInput,
  TravelInput,
  DraftApiResponse,
} from '@/features/assessment/types/assessment.types';

const STEP_ORDER: readonly WizardStep[] = [
  'welcome',
  'transport',
  'energy',
  'diet',
  'shopping',
  'travel',
  'results',
] as const;

const initialState: WizardState = {
  currentStep: 'welcome',
  transport: {
    weeklyKm: 0,
    fuelType: 'none',
    publicTransportWeeklyHours: 0,
    rideShareWeeklyKm: 0,
  },
  energy: {
    electricityKwhPerMonth: 0,
    gasKwhPerMonth: 0,
    renewableEnergyPercent: 0,
    homeSizeSqFt: 0,
    householdMembers: 1,
  },
  diet: {
    dietType: 'mixed',
  },
  shopping: {
    level: 'medium',
  },
  travel: {
    flightsPerYear: 0,
    avgDistanceKm: 0,
    hotelStaysPerYear: 0,
  },
  result: null,
  grade: null,
  recommendations: [],
  isSubmitting: false,
  error: null,
  draftVersion: 0,
  isSaving: false,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_TRANSPORT':
      return { ...state, transport: action.payload };
    case 'SET_ENERGY':
      return { ...state, energy: action.payload };
    case 'SET_DIET':
      return { ...state, diet: action.payload };
    case 'SET_SHOPPING':
      return { ...state, shopping: action.payload };
    case 'SET_TRAVEL':
      return { ...state, travel: action.payload };
    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload, error: null };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null };
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        isSubmitting: false,
        result: action.payload.breakdown,
        grade: action.payload.grade,
        recommendations: action.payload.recommendations,
      };
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, error: action.payload };
    case 'RESTORE_DRAFT': {
      const inputs = action.payload.inputs || {};
      return {
        ...state,
        currentStep: action.payload.step,
        transport: inputs.transport || state.transport,
        energy: inputs.energy || state.energy,
        diet: inputs.diet || state.diet,
        shopping: inputs.shopping || state.shopping,
        travel: inputs.travel || state.travel,
        draftVersion: action.payload.version,
      };
    }
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'INCREMENT_DRAFT_VERSION':
      return { ...state, draftVersion: state.draftVersion + 1 };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

/**
 * Custom hook encapsulating the assessment wizard's state machine.
 */
export function useAssessmentWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const lastSavedInputsRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInteractedRef = useRef<boolean>(false);

  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep);
  const totalSteps = STEP_ORDER.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastInputStep = state.currentStep === 'travel';
  const isResultsStep = state.currentStep === 'results';

  const goToNextStep = useCallback(() => {
    hasInteractedRef.current = true;
    const nextIndex = STEP_ORDER.indexOf(state.currentStep) + 1;
    const nextStep = STEP_ORDER[nextIndex];
    if (nextStep) {
      dispatch({ type: 'GO_TO_STEP', payload: nextStep });
    }
  }, [state.currentStep]);

  const goToPreviousStep = useCallback(() => {
    hasInteractedRef.current = true;
    const prevIndex = STEP_ORDER.indexOf(state.currentStep) - 1;
    const prevStep = STEP_ORDER[prevIndex];
    if (prevStep) {
      dispatch({ type: 'GO_TO_STEP', payload: prevStep });
    }
  }, [state.currentStep]);

  const goToStep = useCallback((step: WizardStep) => {
    hasInteractedRef.current = true;
    dispatch({ type: 'GO_TO_STEP', payload: step });
  }, []);

  const setTransport = useCallback((data: TransportInput) => {
    hasInteractedRef.current = true;
    dispatch({ type: 'SET_TRANSPORT', payload: data });
  }, []);

  const setEnergy = useCallback((data: EnergyInput) => {
    hasInteractedRef.current = true;
    dispatch({ type: 'SET_ENERGY', payload: data });
  }, []);

  const setDiet = useCallback((data: DietInput) => {
    hasInteractedRef.current = true;
    dispatch({ type: 'SET_DIET', payload: data });
  }, []);

  const setShopping = useCallback((data: ShoppingInput) => {
    hasInteractedRef.current = true;
    dispatch({ type: 'SET_SHOPPING', payload: data });
  }, []);

  const setTravel = useCallback((data: TravelInput) => {
    hasInteractedRef.current = true;
    dispatch({ type: 'SET_TRAVEL', payload: data });
  }, []);

  // Restore draft on mount
  const loadDraft = useCallback(async () => {
    if (hasInteractedRef.current) return;
    try {
      const response = await fetch('/api/assessment/draft');
      if (hasInteractedRef.current) return;
      let serverDraft: DraftApiResponse | null = null;
      if (response.ok) {
        serverDraft = (await response.json()) as DraftApiResponse;
      }

      const localDraftStr = localStorage.getItem('ecoguide_assessment_draft');
      let localDraft: (DraftApiResponse & { isUnsynced?: boolean }) | null = null;
      if (localDraftStr) {
        localDraft = JSON.parse(localDraftStr) as DraftApiResponse & { isUnsynced?: boolean };
      }

      if (serverDraft && serverDraft.inputs && localDraft && localDraft.inputs) {
        const serverVersion = serverDraft.draftVersion || 0;
        const localVersion = localDraft.draftVersion || 0;

        if (localDraft.isUnsynced && localVersion > serverVersion) {
          dispatch({
            type: 'RESTORE_DRAFT',
            payload: {
              inputs: localDraft.inputs,
              step: localDraft.currentStep,
              version: localVersion,
            },
          });
          lastSavedInputsRef.current = JSON.stringify({
            ...localDraft.inputs,
            currentStep: localDraft.currentStep,
          });
          return;
        }
      }

      if (serverDraft && serverDraft.inputs) {
        dispatch({
          type: 'RESTORE_DRAFT',
          payload: {
            inputs: serverDraft.inputs,
            step: serverDraft.currentStep,
            version: serverDraft.draftVersion,
          },
        });
        lastSavedInputsRef.current = JSON.stringify({
          ...serverDraft.inputs,
          currentStep: serverDraft.currentStep,
        });
      } else if (localDraft && localDraft.inputs) {
        dispatch({
          type: 'RESTORE_DRAFT',
          payload: {
            inputs: localDraft.inputs,
            step: localDraft.currentStep,
            version: localDraft.draftVersion,
          },
        });
        lastSavedInputsRef.current = JSON.stringify({
          ...localDraft.inputs,
          currentStep: localDraft.currentStep,
        });
      }
    } catch (err) {
      console.error('Failed to load assessment draft:', err);
      // fallback to local storage
      const localDraftStr = localStorage.getItem('ecoguide_assessment_draft');
      if (localDraftStr) {
        const localDraft = JSON.parse(localDraftStr);
        dispatch({
          type: 'RESTORE_DRAFT',
          payload: {
            inputs: localDraft.inputs,
            step: localDraft.currentStep,
            version: localDraft.draftVersion,
          },
        });
        lastSavedInputsRef.current = JSON.stringify(localDraft.inputs);
      }
    }
  }, []);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // Debounced Autosave Trigger
  useEffect(() => {
    if (state.currentStep === 'welcome' || state.currentStep === 'results') {
      return;
    }

    const currentInputs = {
      transport: state.transport,
      energy: state.energy,
      diet: state.diet,
      shopping: state.shopping,
      travel: state.travel,
    };

    const currentInputsStr = JSON.stringify({ ...currentInputs, currentStep: state.currentStep });
    if (currentInputsStr === lastSavedInputsRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    dispatch({ type: 'SET_SAVING', payload: true });

    debounceTimerRef.current = setTimeout(async () => {
      const nextVersion = state.draftVersion + 1;
      const savePayload = {
        inputs: {
          ...currentInputs,
          currentStep: state.currentStep,
        },
        draftVersion: nextVersion,
      };

      try {
        const response = await fetch('/api/assessment/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savePayload),
        });

        if (response.status === 409) {
          const conflictData = await response.json();
          console.warn(
            'Draft conflict detected. Syncing with version:',
            conflictData.storedVersion,
          );
          dispatch({
            type: 'RESTORE_DRAFT',
            payload: {
              inputs: currentInputs,
              step: state.currentStep,
              version: conflictData.storedVersion + 1,
            },
          });
          return;
        }

        if (!response.ok) {
          throw new Error('Save response was not OK');
        }

        lastSavedInputsRef.current = currentInputsStr;
        dispatch({ type: 'INCREMENT_DRAFT_VERSION' });

        localStorage.setItem(
          'ecoguide_assessment_draft',
          JSON.stringify({
            inputs: currentInputs,
            currentStep: state.currentStep,
            draftVersion: nextVersion,
            lastSavedAt: new Date().toISOString(),
          }),
        );
      } catch (err) {
        console.error('Autosave offline/failed, buffering to localStorage:', err);
        localStorage.setItem(
          'ecoguide_assessment_draft',
          JSON.stringify({
            inputs: currentInputs,
            currentStep: state.currentStep,
            draftVersion: state.draftVersion + 1,
            lastSavedAt: new Date().toISOString(),
            isUnsynced: true,
          }),
        );
      } finally {
        dispatch({ type: 'SET_SAVING', payload: false });
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    state.transport,
    state.energy,
    state.diet,
    state.shopping,
    state.travel,
    state.currentStep,
    state.draftVersion,
  ]);

  const submitAssessment = useCallback(
    async (finalTravel?: TravelInput) => {
      dispatch({ type: 'SUBMIT_START' });
      try {
        const response = await fetch('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transport: state.transport,
            energy: state.energy,
            diet: state.diet,
            shopping: state.shopping,
            travel: finalTravel ?? state.travel,
          }),
        });

        if (!response.ok) {
          const errorData = (await response
            .json()
            .catch(() => ({ message: 'Submission failed' }))) as { message?: string };
          throw new Error(errorData.message ?? `HTTP ${response.status}`);
        }

        const data = await response.json();
        dispatch({
          type: 'SUBMIT_SUCCESS',
          payload: {
            breakdown: data.breakdown,
            grade: data.grade,
            recommendations: data.recommendations,
          },
        });

        // Clean local draft
        localStorage.removeItem('ecoguide_assessment_draft');

        dispatch({ type: 'GO_TO_STEP', payload: 'results' });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        dispatch({ type: 'SUBMIT_ERROR', payload: message });
        throw err;
      }
    },
    [state.transport, state.energy, state.diet, state.shopping, state.travel],
  );

  const reset = useCallback(async () => {
    localStorage.removeItem('ecoguide_assessment_draft');
    try {
      await fetch('/api/assessment/draft', { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete remote draft on reset:', err);
    }
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastInputStep,
    isResultsStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    setTransport,
    setEnergy,
    setDiet,
    setShopping,
    setTravel,
    submitAssessment,
    reset,
    stepOrder: STEP_ORDER,
  };
}
