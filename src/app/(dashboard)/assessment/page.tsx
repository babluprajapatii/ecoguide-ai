import type { Metadata } from 'next';
import { AssessmentWizard } from '@/features/assessment/components/AssessmentWizard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Carbon Assessment',
  description: 'Evaluate your carbon footprint across transport, diet, energy, and shopping.',
};

/**
 * Carbon Assessment page — Server Component.
 * Renders the interactive AssessmentWizard client component.
 */
export default function AssessmentPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Carbon Assessment
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Answer a few questions to estimate your annual carbon footprint.
        </p>
      </header>

      <AssessmentWizard />
    </main>
  );
}
