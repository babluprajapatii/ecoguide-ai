import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';
import { z } from 'zod';

const goalCategorySchema = z.enum(['total', 'transport', 'energy', 'diet', 'shopping', 'travel']);
const goalStatusSchema = z.enum(['in_progress', 'completed']);

const createGoalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  category: goalCategorySchema,
  target_value: z.number().min(0, 'Target value must be non-negative'),
  unit: z.string().min(1).max(10),
});

const updateGoalSchema = z.object({
  id: z.string().uuid('Invalid goal ID'),
  current_value: z.number().min(0, 'Current value must be non-negative'),
  status: goalStatusSchema.optional(),
});

/**
 * GET /api/goals
 * Fetches user's goals. (Read-only, no mutation/seeding).
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitResult);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429, headers },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
  }

  const { data: goals, error: dbError } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (dbError) {
    console.error('[API /api/goals GET] Database error:', dbError);
    return NextResponse.json({ message: 'Failed to fetch goals.' }, { status: 500, headers });
  }

  return NextResponse.json(goals, { status: 200, headers });
}

/**
 * POST /api/goals
 * Creates a new custom goal. Checks for duplicate title.
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitResult);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429, headers },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Invalid JSON in request body.' },
      { status: 400, headers },
    );
  }

  const parseResult = createGoalSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { message: 'Validation failed.', errors: parseResult.error.flatten().fieldErrors },
      { status: 400, headers },
    );
  }

  const { title, category, target_value, unit } = parseResult.data;

  // Duplicate protection check
  const { data: existingGoals, error: checkError } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', user.id)
    .eq('title', title)
    .limit(1);

  if (checkError) {
    console.error('[API /api/goals POST] Duplicate check database error:', checkError);
    return NextResponse.json({ message: 'Database query failure.' }, { status: 500, headers });
  }

  if (existingGoals && existingGoals.length > 0) {
    return NextResponse.json(
      { message: 'A goal with this title already exists.' },
      { status: 409, headers },
    );
  }

  const { data: insertedGoal, error: insertError } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title,
      category,
      target_value,
      current_value: 0,
      unit,
      status: 'in_progress',
    })
    .select('*')
    .single();

  if (insertError) {
    console.error('[API /api/goals POST] Insert database error:', insertError);
    return NextResponse.json({ message: 'Failed to create goal.' }, { status: 500, headers });
  }

  return NextResponse.json(insertedGoal, { status: 201, headers });
}

/**
 * PUT /api/goals
 * Updates goal progress and status. Validates ownership.
 */
export async function PUT(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitResult);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429, headers },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Invalid JSON in request body.' },
      { status: 400, headers },
    );
  }

  const parseResult = updateGoalSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { message: 'Validation failed.', errors: parseResult.error.flatten().fieldErrors },
      { status: 400, headers },
    );
  }

  const { id, current_value, status } = parseResult.data;

  // Retrieve existing goal for ownership verification
  const { data: existingGoal, error: fetchError } = await supabase
    .from('goals')
    .select('user_id, target_value')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !existingGoal) {
    return NextResponse.json({ message: 'Goal not found.' }, { status: 404, headers });
  }

  if (existingGoal.user_id !== user.id) {
    return NextResponse.json(
      { message: 'Forbidden: You do not own this goal.' },
      { status: 403, headers },
    );
  }

  // Auto-complete if current value meets or exceeds target value
  const nextStatus =
    status ?? (current_value >= existingGoal.target_value ? 'completed' : 'in_progress');

  const { data: updatedGoal, error: updateError } = await supabase
    .from('goals')
    .update({
      current_value,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    console.error('[API /api/goals PUT] Update database error:', updateError);
    return NextResponse.json({ message: 'Failed to update goal.' }, { status: 500, headers });
  }

  return NextResponse.json(updatedGoal, { status: 200, headers });
}

/**
 * DELETE /api/goals
 * Deletes a goal. Validates ownership.
 * Accepts `id` in query parameters (e.g. /api/goals?id=...).
 */
export async function DELETE(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  const headers = rateLimitHeaders(rateLimitResult);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429, headers },
    );
  }

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
    return NextResponse.json({ message: 'Missing goal ID.' }, { status: 400, headers });
  }

  // Zod validation for UUID
  const deleteParamSchema = z.string().uuid('Invalid goal ID format');
  const parsedId = deleteParamSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json(
      { message: parsedId.error.errors[0]?.message || 'Invalid goal ID format.' },
      { status: 400, headers },
    );
  }

  // Retrieve existing goal for ownership verification
  const { data: existingGoal, error: fetchError } = await supabase
    .from('goals')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !existingGoal) {
    return NextResponse.json({ message: 'Goal not found.' }, { status: 404, headers });
  }

  if (existingGoal.user_id !== user.id) {
    return NextResponse.json(
      { message: 'Forbidden: You do not own this goal.' },
      { status: 403, headers },
    );
  }

  const { error: deleteError } = await supabase.from('goals').delete().eq('id', id);

  if (deleteError) {
    console.error('[API /api/goals DELETE] Delete database error:', deleteError);
    return NextResponse.json({ message: 'Failed to delete goal.' }, { status: 500, headers });
  }

  return NextResponse.json({ message: 'Goal deleted successfully.' }, { status: 200, headers });
}
