import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSimulationSchema,
  updateSimulationSchema,
} from '@/features/simulator/schemas/simulator.schemas';
import { calculateSimulatedImpact } from '@/features/simulator/services/simulation.service';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';
import { z } from 'zod';
import type { FootprintBreakdown } from '@/features/assessment/types/assessment.types';
import type { Database } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

const deleteParamSchema = z.string().uuid('Invalid simulation ID format');

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
export async function GET(request: NextRequest) {
  const rateLimitRes = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitRes);

  if (!rateLimitRes.allowed) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers });
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
    }

    const { data: simulations, error: dbError } = await supabase
      .from('saved_simulations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      logger.error('[API /api/simulator GET] Database fetch error', dbError, { userId: user.id });
      return NextResponse.json(
        { message: 'Failed to retrieve saved simulations.' },
        { status: 500, headers },
      );
    }

    return NextResponse.json(simulations || [], { status: 200, headers });
  } catch (error) {
    logger.error('[API /api/simulator GET] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500, headers });
  }
}

/**
 * POST /api/simulator
 * Saves a new lifestyle simulation scenario. Recomputes all calculations on the server side.
 */
export async function POST(request: NextRequest) {
  const rateLimitRes = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitRes);

  if (!rateLimitRes.allowed) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers });
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
    }

    const body = await request.json();
    const parseResult = createSimulationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { message: 'Validation failed.', errors: parseResult.error.flatten().fieldErrors },
        { status: 400, headers },
      );
    }

    const { scenario_name, scenario_type, configuration, is_favorite, comparison_group_id } =
      parseResult.data;

    // Fetch user's actual baseline to calculate savings on the server
    const { data: latestAssessment } = await supabase
      .from('assessments')
      .select(
        'transport_kg, diet_kg, energy_kg, shopping_kg, travel_score, total_kg, compared_to_average, percentile',
      )
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
      return NextResponse.json({ message: 'Failed to save simulation.' }, { status: 500, headers });
    }

    logger.info('Simulation created', {
      userId: user.id,
      scenarioId: newSimulation.id,
      scenarioType: scenario_type,
      impactScore: results.impactScore,
    });

    // Award XP and check badge unlocks for running simulator
    let pointsAwarded = 0;
    let unlockedBadges: unknown[] = [];
    try {
      const { awardPoints, checkBadgeUnlock } =
        await import('@/features/gamification/services/points.service');
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
      { status: 201, headers },
    );
  } catch (error) {
    logger.error('[API /api/simulator POST] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500, headers });
  }
}

/**
 * PUT /api/simulator
 * Updates configuration, name, or favorite status of a saved simulation. Re-verifies user ownership.
 */
export async function PUT(request: NextRequest) {
  const rateLimitRes = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitRes);

  if (!rateLimitRes.allowed) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers });
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
    }

    const body = await request.json();
    const parseResult = updateSimulationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { message: 'Validation failed.', errors: parseResult.error.flatten().fieldErrors },
        { status: 400, headers },
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
      return NextResponse.json({ message: 'Simulation not found.' }, { status: 404, headers });
    }

    if (existingSim.user_id !== user.id) {
      return NextResponse.json(
        { message: 'Forbidden: You do not own this simulation.' },
        { status: 403, headers },
      );
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
      logger.error('[API /api/simulator PUT] Update error', updateError, {
        userId: user.id,
        simId: id,
      });
      return NextResponse.json(
        { message: 'Failed to update simulation.' },
        { status: 500, headers },
      );
    }

    logger.info('Simulation updated', {
      userId: user.id,
      scenarioId: id,
      updates: Object.keys(updatePayload),
    });

    return NextResponse.json(updatedSim, { status: 200, headers });
  } catch (error) {
    logger.error('[API /api/simulator PUT] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500, headers });
  }
}

/**
 * DELETE /api/simulator
 * Deletes a saved simulation. Verifies ownership.
 */
export async function DELETE(request: NextRequest) {
  const rateLimitRes = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitRes);

  if (!rateLimitRes.allowed) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers });
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Missing simulation ID.' }, { status: 400, headers });
    }

    // Zod validation for UUID
    const parsedId = deleteParamSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json(
        { message: parsedId.error.errors[0]?.message || 'Invalid simulation ID format.' },
        { status: 400, headers },
      );
    }

    // Verify ownership
    const { data: existingSim, error: fetchError } = await supabase
      .from('saved_simulations')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingSim) {
      return NextResponse.json({ message: 'Simulation not found.' }, { status: 404, headers });
    }

    if (existingSim.user_id !== user.id) {
      return NextResponse.json(
        { message: 'Forbidden: You do not own this simulation.' },
        { status: 403, headers },
      );
    }

    const { error: deleteError } = await supabase.from('saved_simulations').delete().eq('id', id);

    if (deleteError) {
      logger.error('[API /api/simulator DELETE] Delete error', deleteError, {
        userId: user.id,
        simId: id,
      });
      return NextResponse.json(
        { message: 'Failed to delete simulation.' },
        { status: 500, headers },
      );
    }

    logger.info('Simulation deleted', { userId: user.id, scenarioId: id });

    return NextResponse.json(
      { message: 'Simulation deleted successfully.' },
      { status: 200, headers },
    );
  } catch (error) {
    logger.error('[API /api/simulator DELETE] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500, headers });
  }
}
