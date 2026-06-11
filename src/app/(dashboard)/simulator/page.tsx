import { SimulatorClient } from '@/features/simulator/components/SimulatorClient';

// Force dynamic rendering to read user session/cookies per-request
export const dynamic = 'force-dynamic';

/**
 * Impact Simulator page — Server Component.
 *
 * Renders the SimulatorClient with the user's baseline footprint.
 * Future enhancement: fetch actual baseline from Supabase here.
 */
export default function SimulatorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <SimulatorClient />
    </div>
  );
}
