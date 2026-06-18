import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSimulationSchema, updateSimulationSchema } from '@/features/simulator/schemas/simulator.schemas';
import { calculateSimulatedImpact } from '@/features/simulator/services/simulation.service';
import { logger } from '@/lib/logger';
import type { FootprintBreakdown } from '@/features/assessment/types/assessment.types';
import type { Database } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

interface RateLimitData {
  readonly timestamps: number[];
}

/** In-memory sliding window rate limits for saving simulations */
const rateLimitStore = new Map<string, RateLimitData>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  const limit = 10; // Max 10 saves/updates per minute

  const data = rateLimitStore.get(userId) || { timestamps: [] };
  const validTimestamps = data.timestamps.filter((t) => now - t < oneMinute);

  if (validTimestamps.length >= limit) {
    const earliest = validTimestamps[0] || now;
    const retryAfter = Math.ceil((earliest + oneMinute - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  validTimestamps.push(now);
  rateLimitStore.set(userId, { timestamps: validTimestamps });
  return { allowed: true, retryAfterSeconds: 0 };
}

const FALLBACK_BASELINE: FootprintBreakdown = {
  transport: 2000,
  diet: 2000,
  energy: 1800,
  shopping: 1200,
  travel: 1000,
  total: 8000,
  comparedToAverage: 1.7,
  percentile: 60,
};

/**
 * GET /api/simulator
 * Retrieves all saved simulations for the authenticated user, sorted by creation date descending.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const { data: simulations, error: dbError } = await supabase
      .from('saved_simulations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      logger.error('[API /api/simulator GET] Database fetch error', dbError, { userId: user.id });
      return NextResponse.json({ message: 'Failed to retrieve saved simulations.' }, { status: 500 });
    }

    return NextResponse.json(simulations || [], { status: 200 });
  } catch (error) {
    logger.error('[API /api/simulator GET] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * POST /api/simulator
 * Saves a new lifestyle simulation scenario. Recomputes all calculations on the server side.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    // Rate Limiting
    const { allowed, retryAfterSeconds } = checkRateLimit(user.id);
    if (!allowed) {
      logger.warn('Simulator rate limit exceeded', { userId: user.id });
      return NextResponse.json(
        { message: `Too many save requests. Please wait ${retryAfterSeconds} seconds.` },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const parseResult = createSimulationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { message: 'Validation failed.', errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { scenario_name, scenario_type, configuration, is_favorite, comparison_group_id } = parseResult.data;

    // Fetch user's actual baseline to calculate savings on the server (never trust client metrics)
    const { data: latestAssessment } = await supabase
      .from('assessments')
      .select('transport_kg, diet_kg, energy_kg, shopping_kg, travel_score, total_kg, compared_to_average, percentile')
      .eq('is_complete', true)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const baseline: FootprintBreakdown = latestAssessment
      ? {
          transport: Number(latestAssessment.transport_kg),
          diet: Number(latestAssessment.diet_kg),
          energy: Number(latestAssessment.energy_kg),
          shopping: Number(latestAssessment.shopping_kg),
          travel: Number(latestAssessment.travel_score),
          total: Number(latestAssessment.total_kg),
          comparedToAverage: Number(latestAssessment.compared_to_average),
          percentile: Number(latestAssessment.percentile),
        }
      : FALLBACK_BASELINE;

    // Recompute calculations securely on the server
    const results = calculateSimulatedImpact(baseline, configuration);

    // Save simulation in Database
    const { data: newSimulation, error: insertError } = await supabase
      .from('saved_simulations')
      .insert({
        user_id: user.id,
        scenario_name,
        scenario_type,
        configuration,
        estimated_carbon_savings: results.carbonSavings,
        estimated_cost_savings: results.costSavings,
        estimated_water_savings: results.waterSavings,
        estimated_energy_savings: results.energySavings,
        impact_score: results.impactScore,
        is_favorite: is_favorite ?? false,
        comparison_group_id: comparison_group_id || null,
      })
      .select('*')
      .single();

    if (insertError) {
      logger.error('[API /api/simulator POST] Insert error', insertError, { userId: user.id });
      return NextResponse.json({ message: 'Failed to save simulation.' }, { status: 500 });
    }

    logger.info('Simulation created', { userId: user.id, scenarioId: newSimulation.id, scenarioType: scenario_type, impactScore: results.impactScore });

    // Award XP and check badge unlocks for running simulator
    let pointsAwarded = 0;
    let unlockedBadges: unknown[] = [];
    try {
      const { awardPoints, checkBadgeUnlock } = await import('@/features/gamification/services/points.service');
      pointsAwarded = await awardPoints(user.id, 'run_simulator');
      unlockedBadges = await checkBadgeUnlock(user.id, 'run_simulator');
    } catch (err) {
      logger.error('Failed to award points/badges for simulator run', err, { userId: user.id });
    }

    return NextResponse.json(
      {
        ...newSimulation,
        pointsAwarded,
        unlockedBadges,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[API /api/simulator POST] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * PUT /api/simulator
 * Updates configuration, name, or favorite status of a saved simulation. Re-verifies user ownership.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = updateSimulationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { message: 'Validation failed.', errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, scenario_name, is_favorite, comparison_group_id } = parseResult.data;

    // Verify ownership
    const { data: existingSim, error: fetchError } = await supabase
      .from('saved_simulations')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingSim) {
      return NextResponse.json({ message: 'Simulation not found.' }, { status: 404 });
    }

    if (existingSim.user_id !== user.id) {
      return NextResponse.json({ message: 'Forbidden: You do not own this simulation.' }, { status: 403 });
    }

    const updatePayload: Database['public']['Tables']['saved_simulations']['Update'] = {};
    if (scenario_name !== undefined) updatePayload.scenario_name = scenario_name;
    if (is_favorite !== undefined) updatePayload.is_favorite = is_favorite;
    if (comparison_group_id !== undefined) updatePayload.comparison_group_id = comparison_group_id;

    const { data: updatedSim, error: updateError } = await supabase
      .from('saved_simulations')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      logger.error('[API /api/simulator PUT] Update error', updateError, { userId: user.id, simId: id });
      return NextResponse.json({ message: 'Failed to update simulation.' }, { status: 500 });
    }

    logger.info('Simulation updated', { userId: user.id, scenarioId: id, updates: Object.keys(updatePayload) });

    return NextResponse.json(updatedSim, { status: 200 });
  } catch (error) {
    logger.error('[API /api/simulator PUT] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * DELETE /api/simulator
 * Deletes a saved simulation. Verifies ownership.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Missing simulation ID.' }, { status: 400 });
    }

    // Verify ownership
    const { data: existingSim, error: fetchError } = await supabase
      .from('saved_simulations')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingSim) {
      return NextResponse.json({ message: 'Simulation not found.' }, { status: 404 });
    }

    if (existingSim.user_id !== user.id) {
      return NextResponse.json({ message: 'Forbidden: You do not own this simulation.' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('saved_simulations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('[API /api/simulator DELETE] Delete error', deleteError, { userId: user.id, simId: id });
      return NextResponse.json({ message: 'Failed to delete simulation.' }, { status: 500 });
    }

    logger.info('Simulation deleted', { userId: user.id, scenarioId: id });

    return NextResponse.json({ message: 'Simulation deleted successfully.' }, { status: 200 });
  } catch (error) {
    logger.error('[API /api/simulator DELETE] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
