import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assessmentInputSchema } from '@/features/assessment/schemas/assessment.schemas';
import { calculateTotalFootprint } from '@/features/assessment/services/carbon-calculator.service';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';
import type { FootprintBreakdown } from '@/features/assessment/types/assessment.types';

/**
 * Returns a grade letter (A+ to F) based on percentile score.
 */
function getGrade(percentile: number): string {
  if (percentile <= 15) return 'A+';
  if (percentile <= 30) return 'A';
  if (percentile <= 45) return 'B';
  if (percentile <= 60) return 'C';
  if (percentile <= 75) return 'D';
  return 'F';
}

/**
 * Generates tailored sustainability recommendations based on category footprints.
 */
function generateRecommendations(breakdown: FootprintBreakdown): string[] {
  const recommendations: string[] = [];

  if (breakdown.transport > 2000) {
    recommendations.push(
      'Consider taking public transit or carpooling to reduce transport emissions.',
      'Switching to an electric or hybrid vehicle can significantly lower your carbon footprint.'
    );
  }
  if (breakdown.energy > 2000) {
    recommendations.push(
      'Improve home energy efficiency by upgrading insulation or using LED lighting.',
      'Switch to a green/renewable electricity provider to cut down energy emissions.'
    );
  }
  if (breakdown.diet > 2000) {
    recommendations.push(
      'Try incorporating more plant-based meals into your diet (e.g., Meatless Mondays).'
    );
  }
  if (breakdown.shopping > 1000) {
    recommendations.push(
      'Practice mindful consumption: buy second-hand, repair items, and reduce unnecessary spending.'
    );
  }
  if (breakdown.travel > 1500) {
    recommendations.push(
      'Combine business trips, take trains instead of short flights, and stay in eco-certified hotels.'
    );
  }

  // Fallbacks if user has a very low footprint or to reach minimum card options
  if (recommendations.length < 3) {
    recommendations.push(
      'Keep up the excellent sustainable habits and share your progress with others!',
      'Support local environmental initiatives and offset remaining emissions through verified projects.',
      'Consider composting organic waste to reduce household methane emissions.'
    );
  }

  return recommendations;
}

/**
 * POST /api/assessment
 *
 * Accepts a full assessment input, validates it, computes emissions,
 * saves the completed row to the database, deletes any active draft,
 * and returns the breakdown, grade, and recommendations.
 */
export async function POST(request: NextRequest) {
  // Rate limit check
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) },
    );
  }

  // Auth check
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

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Invalid JSON in request body.' },
      { status: 400, headers: rateLimitHeaders(rateLimitResult) },
    );
  }

  const parseResult = assessmentInputSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        message: 'Validation failed.',
        errors: parseResult.error.flatten().fieldErrors,
      },
      { status: 422, headers: rateLimitHeaders(rateLimitResult) },
    );
  }

  // Calculate footprint
  const input = parseResult.data;
  const breakdown = calculateTotalFootprint({
    transport: input.transport,
    energy: input.energy,
    diet: input.diet,
    shopping: input.shopping,
    travel: input.travel,
  });

  const grade = getGrade(breakdown.percentile);
  const recommendations = generateRecommendations(breakdown);

  // Persist to Supabase and delete draft in parallel/transaction
  const { data: insertedRow, error: dbError } = await supabase
    .from('assessments')
    .insert({
      user_id: user.id,
      is_complete: true,
      inputs: input as unknown as Record<string, unknown>,
      transport_input: input.transport as unknown as Record<string, unknown>,
      diet_input: input.diet as unknown as Record<string, unknown>,
      energy_input: input.energy as unknown as Record<string, unknown>,
      shopping_input: input.shopping as unknown as Record<string, unknown>,
      transport_kg: breakdown.transport,
      diet_kg: breakdown.diet,
      energy_kg: breakdown.energy,
      shopping_kg: breakdown.shopping,
      total_kg: breakdown.total,
      transport_score: breakdown.transport,
      energy_score: breakdown.energy,
      diet_score: breakdown.diet,
      shopping_score: breakdown.shopping,
      travel_score: breakdown.travel,
      total_score: breakdown.total,
      compared_to_average: breakdown.comparedToAverage,
      percentile: breakdown.percentile,
      grade: grade,
    })
    .select('id, created_at')
    .single();

  if (dbError) {
    console.error('[API /assessment] Supabase insert error:', dbError);
    return NextResponse.json(
      { message: 'Failed to save assessment. Please try again.' },
      { status: 500, headers: rateLimitHeaders(rateLimitResult) },
    );
  }

  // Seed default goals if this is the user's first completed assessment
  let action: 'complete_assessment' | 'update_assessment' = 'update_assessment';
  try {
    const { count, error: countError } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_complete', true);

    if (!countError && count === 1) {
      action = 'complete_assessment';
      const defaultGoals = [
        {
          user_id: user.id,
          title: 'Reduce carbon footprint by 10%',
          category: 'total',
          target_value: 10,
          current_value: 0,
          unit: '%',
          status: 'in_progress',
        },
        {
          user_id: user.id,
          title: 'Switch to 100% renewable energy',
          category: 'energy',
          target_value: 100,
          current_value: 0,
          unit: '%',
          status: 'in_progress',
        },
        {
          user_id: user.id,
          title: 'Reduce annual travel emissions by 500kg',
          category: 'travel',
          target_value: 500,
          current_value: 0,
          unit: 'kg',
          status: 'in_progress',
        },
      ];

      const { error: goalsSeedError } = await supabase
        .from('goals')
        .insert(defaultGoals);

      if (goalsSeedError) {
        console.warn('[API /assessment] Failed to seed default goals:', goalsSeedError);
      }
    }
  } catch (err) {
    console.error('[API /assessment] Error checking/seeding goals:', err);
  }

  // Award XP and check badge unlocks for assessment completion
  let pointsAwarded = 0;
  let unlockedBadges: unknown[] = [];
  try {
    const { awardPoints, checkBadgeUnlock } = await import('@/features/gamification/services/points.service');
    pointsAwarded = await awardPoints(user.id, action);
    unlockedBadges = await checkBadgeUnlock(user.id, action);
  } catch (err) {
    console.error('[API /assessment] Failed to award gamification points/badges:', err);
  }

  // Proactively delete the active draft now that the assessment is complete
  const { error: draftDeleteError } = await supabase
    .from('assessments')
    .delete()
    .eq('user_id', user.id)
    .eq('is_complete', false);

  if (draftDeleteError) {
    console.warn('[API /assessment] Failed to clear draft:', draftDeleteError);
    // Do not fail the request if just the draft deletion failed
  }

  return NextResponse.json(
    {
      id: insertedRow.id as string,
      breakdown,
      grade,
      recommendations,
      createdAt: insertedRow.created_at as string,
      pointsAwarded,
      unlockedBadges,
    },
    { status: 201, headers: rateLimitHeaders(rateLimitResult) },
  );
}
