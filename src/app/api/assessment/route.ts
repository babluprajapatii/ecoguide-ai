import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assessmentInputSchema } from '@/features/assessment/schemas/assessment.schemas';
import { calculateTotalFootprint } from '@/features/assessment/services/carbon-calculator.service';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';

/**
 * POST /api/assessment
 *
 * Accepts a full assessment input, validates it with Zod, computes
 * the carbon footprint breakdown, persists the result to Supabase,
 * and returns the breakdown to the client.
 *
 * Requires authentication. Rate-limited to 20 requests per minute.
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
    diet: input.diet,
    energy: input.energy,
    shopping: input.shopping,
  });

  // Persist to Supabase
  const { data: insertedRow, error: dbError } = await supabase
    .from('assessments')
    .insert({
      user_id: user.id,
      transport_input: input.transport as unknown as Record<string, unknown>,
      diet_input: input.diet as unknown as Record<string, unknown>,
      energy_input: input.energy as unknown as Record<string, unknown>,
      shopping_input: input.shopping as unknown as Record<string, unknown>,
      transport_kg: breakdown.transport,
      diet_kg: breakdown.diet,
      energy_kg: breakdown.energy,
      shopping_kg: breakdown.shopping,
      total_kg: breakdown.total,
      compared_to_average: breakdown.comparedToAverage,
      percentile: breakdown.percentile,
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

  return NextResponse.json(
    {
      id: insertedRow.id as string,
      breakdown,
      createdAt: insertedRow.created_at as string,
    },
    { status: 201, headers: rateLimitHeaders(rateLimitResult) },
  );
}
