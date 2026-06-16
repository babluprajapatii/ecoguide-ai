'use client';

import { useEffect, useRef } from 'react';
import { useAssessmentWizard } from '@/features/assessment/hooks/use-assessment-wizard';
import { ProgressBar } from '@/features/assessment/components/ProgressBar';
import { WelcomeStep } from '@/features/assessment/components/steps/WelcomeStep';
import { TransportStep } from '@/features/assessment/components/steps/TransportStep';
import { EnergyStep } from '@/features/assessment/components/steps/EnergyStep';
import { DietStep } from '@/features/assessment/components/steps/DietStep';
import { ShoppingStep } from '@/features/assessment/components/steps/ShoppingStep';
import { TravelStep } from '@/features/assessment/components/steps/TravelStep';
import { ReviewStep } from '@/features/assessment/components/steps/ReviewStep';
import { ResultsCharts } from '@/features/assessment/components/ResultsCharts';
import { RecommendationsList } from '@/features/assessment/components/RecommendationsList';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBadges } from '@/features/gamification/hooks/useBadges';
import { motion, AnimatePresence } from 'framer-motion';

const STEP_LABELS = [
  'Welcome',
  'Transport',
  'Energy',
  'Diet',
  'Shopping',
  'Travel',
  'Results',
] as const;

/**
 * 7-step carbon footprint assessment wizard.
 */
export function AssessmentWizard() {
  const wizard = useAssessmentWizard();
  const { user } = useAuth();
  const { checkUnlocks } = useBadges(user?.id ?? null);
  const processedRef = useRef(false);

  // Trigger gamification badge unlocks when submission completes
  useEffect(() => {
    if (wizard.state.result && !processedRef.current) {
      processedRef.current = true;
      const breakdown = wizard.state.result;

      // Complete first assessment badge
      void checkUnlocks('complete_assessment');

      // Under 10 tonnes badge
      if (breakdown.total < 10000) {
        void checkUnlocks('achieve_under_10t');
      }

      // Under 2 tonnes badge
      if (breakdown.total < 2000) {
        void checkUnlocks('achieve_under_2t');
      }

      // 100% clean energy badge
      if (wizard.state.energy.renewableEnergyPercent === 100) {
        void checkUnlocks('energy_with_solar');
      }
    } else if (!wizard.state.result) {
      processedRef.current = false;
    }
  }, [wizard.state.result, wizard.state.energy, checkUnlocks]);

  const renderStep = () => {
    switch (wizard.state.currentStep) {
      case 'welcome':
        return (
          <WelcomeStep
            onNext={wizard.goToNextStep}
          />
        );
      case 'transport':
        return (
          <TransportStep
            initialData={wizard.state.transport}
            onNext={(data) => {
              wizard.setTransport(data);
              wizard.goToNextStep();
            }}
            isSaving={wizard.state.isSaving}
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
            isSaving={wizard.state.isSaving}
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
            isSaving={wizard.state.isSaving}
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
            isSaving={wizard.state.isSaving}
          />
        );
      case 'travel':
        return (
          <TravelStep
            initialData={wizard.state.travel}
            onNext={(data) => {
              wizard.setTravel(data);
              wizard.goToNextStep();
            }}
            onBack={wizard.goToPreviousStep}
            isSaving={wizard.state.isSaving}
          />
        );
      case 'results':
        // If not submitted yet, show the review stage
        if (!wizard.state.result) {
          return (
            <ReviewStep
              transport={wizard.state.transport}
              energy={wizard.state.energy}
              diet={wizard.state.diet}
              shopping={wizard.state.shopping}
              travel={wizard.state.travel}
              result={wizard.state.result}
              isSubmitting={wizard.state.isSubmitting}
              error={wizard.state.error}
              onBack={wizard.goToPreviousStep}
              onSubmit={() => {
                void wizard.submitAssessment();
              }}
            />
          );
        }

        // Once submitted successfully, render Results layout
        return (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-foreground">Your Carbon Footprint is Ready!</h2>
              <p className="text-muted-foreground text-sm">
                Here is your localized annual emissions overview compared to global baselines.
              </p>
              {wizard.state.grade && (
                <div className="inline-block mt-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-4 py-1.5 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  Environmental Impact Grade: {wizard.state.grade}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResultsCharts breakdown={wizard.state.result} />
              <RecommendationsList
                recommendations={wizard.state.recommendations}
              />
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={wizard.reset}
                className="rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent active:scale-95"
              >
                Reset &amp; Take Again
              </button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-6 space-y-6">
      <ProgressBar
        currentStep={wizard.currentStepIndex}
        totalSteps={wizard.totalSteps}
        stepLabels={STEP_LABELS}
      />
      <div className="relative rounded-2xl border border-border bg-card/60 p-6 md:p-8 shadow-xl backdrop-blur-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={wizard.state.currentStep + (wizard.state.result ? '_submitted' : '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
