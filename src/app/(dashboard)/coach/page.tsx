import type { Metadata } from 'next';
import { fetchUserHighestCategory } from '@/features/coach/services/coach.service';
import { CoachInterface } from '@/features/coach/components/CoachInterface';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sustainability Coach',
  description: 'Chat with EcoGuide, your AI-powered sustainability coach, to get personalized, actionable green recommendations.',
};

/**
 * Coach page Server Component.
 * Hydrates the coach interface with the user's highest emissions category server-side.
 */
export default async function CoachPage() {
  const highestCategory = await fetchUserHighestCategory();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Sustainability Coach
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receive tailored guidance and support from EcoGuide on reducing your environmental footprint.
        </p>
      </header>

      <div className="w-full">
        <CoachInterface highestCategory={highestCategory} />
      </div>
    </main>
  );
}
