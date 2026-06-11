import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';
import type { AssessmentRecord, DashboardData } from '@/features/dashboard/types/dashboard.types';

/** Maximum number of historical assessments to return. */
const MAX_HISTORY = 20;

/**
 * GET /api/dashboard
 *
 * Returns aggregated dashboard data for the authenticated user.
 * Rate-limited to 20 requests per minute.
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) },
    );
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: 'Authentication required.' },
        { status: 401, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    const { data: rows, error: dbError } = await supabase
      .from('assessments')
      .select(
        'id, user_id, transport_kg, diet_kg, energy_kg, shopping_kg, total_kg, compared_to_average, percentile, created_at',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY);

    if (dbError) {
      console.error('[API /dashboard] Supabase query error:', dbError);
      return NextResponse.json(
        { message: 'Failed to load dashboard data.' },
        { status: 500, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    const typedRows: AssessmentRecord[] = (rows ?? []).map((row) => ({
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
    const history = [...typedRows].reverse();

    const dashboardData: DashboardData = {
      latestAssessment,
      history,
    };

    return NextResponse.json(dashboardData, {
      status: 200,
      headers: rateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    console.warn(
      '[API /dashboard] Supabase client creation failed (missing/invalid credentials). Returning fallback empty dashboard:',
      error,
    );
    return NextResponse.json(
      { latestAssessment: null, history: [] },
      { status: 200, headers: rateLimitHeaders(rateLimitResult) },
    );
  }
}
