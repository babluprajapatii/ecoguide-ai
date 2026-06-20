import type { Metadata } from 'next';
import { fetchUserHighestCategory } from '@/features/coach/services/coach.service';
import { CoachClient } from '@/features/coach/components/CoachClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Sustainability Coach',
  description:
    'Chat with EcoGuide, your AI-powered sustainability coach, to get personalized, actionable green recommendations.',
};

/**
 * Coach page Server Component.
 * Hydrates the coach client workspace with the user's highest emissions category server-side.
 */
export default async function CoachPage() {
  const highestCategory = await fetchUserHighestCategory();

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          AI Sustainability Coach
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Receive tailored guidance, construct action plans, and track recommended eco actions.
        </p>
      </header>

      <CoachClient highestCategory={highestCategory} />
    </main>
  );
}
