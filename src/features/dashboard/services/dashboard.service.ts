/**
 * Dashboard data service — server-side data fetching from Supabase.
 *
 * Used by the Server Component page to load initial data without
 * a client-side waterfall. All functions return typed data or null
 * on failure (letting the UI handle empty states gracefully).
 *
 * @module dashboard.service
 */

import { createClient } from '@/lib/supabase/server';
import type { DashboardData, AssessmentRecord } from '@/features/dashboard/types/dashboard.types';

/** Maximum number of historical assessments to fetch for the trend chart. */
const MAX_HISTORY = 20;

/**
 * Fetches dashboard data for the authenticated user from Supabase.
 *
 * Retrieves the most recent assessment and up to `MAX_HISTORY`
 * historical records ordered by creation date. Returns `null`
 * values gracefully if the user has no assessments yet.
 *
 * @returns Dashboard data containing latest assessment and history.
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { latestAssessment: null, history: [] };
    }

    const { data: rows, error } = await supabase
      .from('assessments')
      .select(
        'id, user_id, transport_kg, diet_kg, energy_kg, shopping_kg, total_kg, compared_to_average, percentile, created_at',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY);

    if (error || !rows) {
      console.error('[Dashboard] Failed to fetch assessments:', error);
      return { latestAssessment: null, history: [] };
    }

    const typedRows: AssessmentRecord[] = rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      transport_kg: row.transport_kg,
      diet_kg: row.diet_kg,
      energy_kg: row.energy_kg,
      shopping_kg: row.shopping_kg,
      total_kg: row.total_kg,
      compared_to_average: row.compared_to_average,
      percentile: row.percentile,
      created_at: row.created_at,
    }));

    const latestAssessment = typedRows[0] ?? null;
    // Reverse to get oldest-first for the trend chart
    const history = [...typedRows].reverse();

    return { latestAssessment, history };
  } catch (error) {
    console.warn(
      '[Dashboard] Supabase service not configured or query failed. Returning fallback empty state:',
      error,
    );
    return { latestAssessment: null, history: [] };
  }
}
