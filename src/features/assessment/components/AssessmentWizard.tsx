'use client';

import { useAssessmentWizard } from '@/features/assessment/hooks/use-assessment-wizard';
import { ProgressBar } from '@/features/assessment/components/ProgressBar';
import { WelcomeStep } from '@/features/assessment/components/steps/WelcomeStep';
import { TransportStep } from '@/features/assessment/components/steps/TransportStep';
import { EnergyStep } from '@/features/assessment/components/steps/EnergyStep';
import { DietStep } from '@/features/assessment/components/steps/DietStep';
import { ShoppingStep } from '@/features/assessment/components/steps/ShoppingStep';
import { TravelStep } from '@/features/assessment/components/steps/TravelStep';
import { ReviewStep } from '@/features/assessment/components/steps/ReviewStep';
import { RecommendationsList } from '@/features/assessment/components/RecommendationsList';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBadges } from '@/features/gamification/hooks/useBadges';
import { useA11y } from '@/providers/a11y-announcer-provider';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const ResultsCharts = dynamic(
  () => import('@/features/assessment/components/ResultsCharts').then((mod) => mod.ResultsCharts),
  {
    loading: () => (
      <div className="h-[300px] animate-pulse rounded-2xl border border-border/80 bg-muted/20" />
    ),
    ssr: false,
  },
);

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
  const { showBadgeToast, refresh } = useBadges(user?.id ?? null);
  const { announce } = useA11y();

  const renderStep = () => {
    switch (wizard.state.currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={wizard.goToNextStep} />;
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
              onSubmit={async () => {
                try {
                  const data = await wizard.submitAssessment();
                  if (data) {
                    announce(
                      `Assessment completed! Your carbon footprint is ${Math.round(data.breakdown.total)} kilograms of CO2 per year, grade ${data.grade}.`,
                      'assertive',
                    );
                    if (Array.isArray(data.unlockedBadges)) {
                      for (const badge of data.unlockedBadges) {
                        showBadgeToast(badge);
                      }
                    }
                  }
                  void refresh();
                } catch (err) {
                  console.error('Failed to submit assessment:', err);
                }
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
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-extrabold text-foreground">
                Your Carbon Footprint is Ready!
              </h2>
              <p className="text-sm text-muted-foreground">
                Here is your localized annual emissions overview compared to global baselines.
              </p>
              {wizard.state.grade && (
                <div className="mt-2 inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Environmental Impact Grade: {wizard.state.grade}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <ResultsCharts breakdown={wizard.state.result} />
              <RecommendationsList recommendations={wizard.state.recommendations} />
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
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <ProgressBar
        currentStep={wizard.currentStepIndex}
        totalSteps={wizard.totalSteps}
        stepLabels={STEP_LABELS}
      />
      <div className="relative rounded-2xl border border-border bg-card/60 p-6 shadow-xl backdrop-blur-md md:p-8">
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
