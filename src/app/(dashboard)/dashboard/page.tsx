import { fetchDashboardData } from '@/features/dashboard/services/dashboard.service';
import { DashboardClient } from '@/features/dashboard/components/DashboardClient';

// Force dynamic rendering since we are reading cookies / Supabase session per-request
export const dynamic = 'force-dynamic';

/**
 * Dashboard page — Server Component.
 *
 * Pre-fetches the user's latest assessment and history on the server
 * to eliminate client-side loading waterfalls, then forwards it as
 * props to the client bundle.
 */
export default async function DashboardPage() {
  const initialData = await fetchDashboardData();

  return <DashboardClient initialData={initialData} />;
}
