'use client';

import { useCallback, useReducer } from 'react';
import type {
  WizardState,
  WizardAction,
  WizardStep,
  TransportInput,
  DietInput,
  EnergyInput,
  ShoppingInput,
  FootprintBreakdown,
} from '@/features/assessment/types/assessment.types';

const STEP_ORDER: readonly WizardStep[] = [
  'transport',
  'diet',
  'energy',
  'shopping',
  'review',
] as const;

const initialState: WizardState = {
  currentStep: 'transport',
  transport: { flights: [] },
  diet: { dietType: 'mixed' },
  energy: { electricityKwhPerMonth: 0, gasKwhPerMonth: 0 },
  shopping: { level: 'medium' },
  result: null,
  isSubmitting: false,
  error: null,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_TRANSPORT':
      return { ...state, transport: action.payload };
    case 'SET_DIET':
      return { ...state, diet: action.payload };
    case 'SET_ENERGY':
      return { ...state, energy: action.payload };
    case 'SET_SHOPPING':
      return { ...state, shopping: action.payload };
    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload, error: null };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, result: action.payload };
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, error: action.payload };
    case 'RESET':
      return initialState;
  }
}

/**
 * Custom hook encapsulating the assessment wizard's state machine.
 *
 * Uses `useReducer` for predictable state transitions across the
 * 5-step wizard flow: Transport → Diet → Energy → Shopping → Review.
 *
 * @returns Wizard state, navigation helpers, data setters, and submit handler.
 */
export function useAssessmentWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep);
  const totalSteps = STEP_ORDER.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastInputStep = state.currentStep === 'shopping';
  const isReviewStep = state.currentStep === 'review';

  const goToNextStep = useCallback(() => {
    const nextIndex = STEP_ORDER.indexOf(state.currentStep) + 1;
    const nextStep = STEP_ORDER[nextIndex];
    if (nextStep) {
      dispatch({ type: 'GO_TO_STEP', payload: nextStep });
    }
  }, [state.currentStep]);

  const goToPreviousStep = useCallback(() => {
    const prevIndex = STEP_ORDER.indexOf(state.currentStep) - 1;
    const prevStep = STEP_ORDER[prevIndex];
    if (prevStep) {
      dispatch({ type: 'GO_TO_STEP', payload: prevStep });
    }
  }, [state.currentStep]);

  const goToStep = useCallback((step: WizardStep) => {
    dispatch({ type: 'GO_TO_STEP', payload: step });
  }, []);

  const setTransport = useCallback((data: TransportInput) => {
    dispatch({ type: 'SET_TRANSPORT', payload: data });
  }, []);

  const setDiet = useCallback((data: DietInput) => {
    dispatch({ type: 'SET_DIET', payload: data });
  }, []);

  const setEnergy = useCallback((data: EnergyInput) => {
    dispatch({ type: 'SET_ENERGY', payload: data });
  }, []);

  const setShopping = useCallback((data: ShoppingInput) => {
    dispatch({ type: 'SET_SHOPPING', payload: data });
  }, []);

  const submitAssessment = useCallback(async () => {
    dispatch({ type: 'SUBMIT_START' });
    try {
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transport: state.transport,
          diet: state.diet,
          energy: state.energy,
          shopping: state.shopping,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Submission failed' })) as { message?: string };
        throw new Error(errorData.message ?? `HTTP ${response.status}`);
      }

      const data = await response.json() as { breakdown: FootprintBreakdown };
      dispatch({ type: 'SUBMIT_SUCCESS', payload: data.breakdown });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      dispatch({ type: 'SUBMIT_ERROR', payload: message });
    }
  }, [state.transport, state.diet, state.energy, state.shopping]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastInputStep,
    isReviewStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    setTransport,
    setDiet,
    setEnergy,
    setShopping,
    submitAssessment,
    reset,
    stepOrder: STEP_ORDER,
  };
}
