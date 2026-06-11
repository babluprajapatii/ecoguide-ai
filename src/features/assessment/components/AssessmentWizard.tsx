'use client';

import { useAssessmentWizard } from '@/features/assessment/hooks/use-assessment-wizard';
import { ProgressBar } from '@/features/assessment/components/ProgressBar';
import { TransportStep } from '@/features/assessment/components/steps/TransportStep';
import { DietStep } from '@/features/assessment/components/steps/DietStep';
import { EnergyStep } from '@/features/assessment/components/steps/EnergyStep';
import { ShoppingStep } from '@/features/assessment/components/steps/ShoppingStep';
import { ReviewStep } from '@/features/assessment/components/steps/ReviewStep';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBadges } from '@/features/gamification/hooks/useBadges';

const STEP_LABELS = ['Transport', 'Diet', 'Energy', 'Shopping', 'Review'] as const;

/**
 * 5-step assessment wizard for calculating a user's carbon footprint.
 *
 * Uses `useReducer` (via `useAssessmentWizard`) for predictable state
 * management. Each step validates its data with Zod before advancing.
 * Back navigation preserves all previously entered data.
 *
 * On the Review step, a live preview of the calculated breakdown is
 * shown. Submitting POSTs to `/api/assessment` and persists to Supabase.
 */
export function AssessmentWizard() {
  const wizard = useAssessmentWizard();
  const { user } = useAuth();
  const { checkUnlocks } = useBadges(user?.id ?? null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (wizard.state.result && !processedRef.current) {
      processedRef.current = true;
      const breakdown = wizard.state.result;

      // 1. First carbon assessment badge
      void checkUnlocks('complete_assessment');

      // 2. Achieve footprint under 10 tonnes
      if (breakdown.total < 10000) {
        void checkUnlocks('achieve_under_10t');
      }

      // 3. Achieve footprint under 2 tonnes
      if (breakdown.total < 2000) {
        void checkUnlocks('achieve_under_2t');
      }

      // 4. Energy assessment with solar (electricity grid factor = 0)
      if (wizard.state.energy.electricityGridFactor === 0) {
        void checkUnlocks('energy_with_solar');
      }
    } else if (!wizard.state.result) {
      processedRef.current = false;
    }
  }, [wizard.state.result, wizard.state.energy, checkUnlocks]);

  const renderStep = () => {
    switch (wizard.state.currentStep) {
      case 'transport':
        return (
          <TransportStep
            initialData={wizard.state.transport}
            onNext={(data) => {
              wizard.setTransport(data);
              wizard.goToNextStep();
            }}
          />
        );
      case 'diet':
        return (
          <DietStep
            initialData={wizard.state.diet}
            onNext={(data) => {
              wizard.setDiet(data);
              wizard.goToNextStep();
            }}
            onBack={wizard.goToPreviousStep}
          />
        );
      case 'energy':
        return (
          <EnergyStep
            initialData={wizard.state.energy}
            onNext={(data) => {
              wizard.setEnergy(data);
              wizard.goToNextStep();
            }}
            onBack={wizard.goToPreviousStep}
          />
        );
      case 'shopping':
        return (
          <ShoppingStep
            initialData={wizard.state.shopping}
            onNext={(data) => {
              wizard.setShopping(data);
              wizard.goToNextStep();
            }}
            onBack={wizard.goToPreviousStep}
          />
        );
      case 'review':
        return (
          <ReviewStep
            transport={wizard.state.transport}
            diet={wizard.state.diet}
            energy={wizard.state.energy}
            shopping={wizard.state.shopping}
            result={wizard.state.result}
            isSubmitting={wizard.state.isSubmitting}
            error={wizard.state.error}
            onBack={wizard.goToPreviousStep}
            onSubmit={wizard.submitAssessment}
          />
        );
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <ProgressBar
        currentStep={wizard.currentStepIndex}
        totalSteps={wizard.totalSteps}
        stepLabels={STEP_LABELS}
      />
      {renderStep()}
    </div>
  );
}
