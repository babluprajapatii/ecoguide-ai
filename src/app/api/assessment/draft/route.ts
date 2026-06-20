import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limiter';

/**
 * GET /api/assessment/draft
 * Restores the latest incomplete draft for the authenticated user.
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

  const { data: draft, error: dbError } = await supabase
    .from('assessments')
    .select('id, inputs, draft_version, last_saved_at')
    .eq('user_id', user.id)
    .eq('is_complete', false)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dbError) {
    console.error('[API /assessment/draft GET] Database error:', dbError);
    return NextResponse.json({ message: 'Failed to fetch draft.' }, { status: 500, headers });
  }

  if (!draft) {
    return NextResponse.json({ message: 'No draft found.' }, { status: 404, headers });
  }

  // extract currentStep from inputs if stored, otherwise default to 'welcome'
  const inputs = draft.inputs as Record<string, unknown> & { currentStep?: string };
  const currentStep = inputs?.currentStep || 'welcome';

  return NextResponse.json(
    {
      inputs: inputs,
      currentStep: currentStep,
      draftVersion: draft.draft_version,
      lastSavedAt: draft.last_saved_at,
    },
    { status: 200, headers },
  );
}

/**
 * POST /api/assessment/draft
 * Saves or updates the assessment draft with OCC (Optimistic Concurrency Control) version checks.
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

  let body: { inputs?: Record<string, unknown>; draftVersion?: number; draft_version?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { message: 'Invalid JSON in request body.' },
      { status: 400, headers },
    );
  }

  const inputs = body.inputs;
  if (!inputs) {
    return NextResponse.json(
      { message: 'Missing inputs in request body.' },
      { status: 400, headers },
    );
  }

  // Retrieve current draft if any
  const { data: existingDraft, error: fetchError } = await supabase
    .from('assessments')
    .select('id, draft_version')
    .eq('user_id', user.id)
    .eq('is_complete', false)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('[API /assessment/draft POST] Fetch error:', fetchError);
    return NextResponse.json(
      { message: 'Database error fetching draft.' },
      { status: 500, headers },
    );
  }

  const nowString = new Date().toISOString();

  if (existingDraft) {
    const storedVersion = existingDraft.draft_version;
    const clientVersion = body.draftVersion ?? body.draft_version;

    // Verify draft_version = stored_version + 1 for OCC
    if (clientVersion !== undefined && clientVersion !== storedVersion + 1) {
      return NextResponse.json(
        {
          message: 'Conflict: draft version mismatch. Out-of-order save rejected.',
          storedVersion,
        },
        { status: 409, headers },
      );
    }

    const nextVersion = storedVersion + 1;
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        inputs: inputs,
        draft_version: nextVersion,
        last_saved_at: nowString,
        updated_at: nowString,
      })
      .eq('id', existingDraft.id);

    if (updateError) {
      console.error('[API /assessment/draft POST] Update error:', updateError);
      return NextResponse.json({ message: 'Failed to update draft.' }, { status: 500, headers });
    }

    return NextResponse.json(
      {
        message: 'Draft updated.',
        draftVersion: nextVersion,
        lastSavedAt: nowString,
      },
      { status: 200, headers },
    );
  } else {
    // No existing draft. Create one.
    const { error: insertError } = await supabase.from('assessments').insert({
      user_id: user.id,
      is_complete: false,
      inputs: inputs,
      draft_version: 1,
      last_saved_at: nowString,
      updated_at: nowString,
    });

    if (insertError) {
      console.error('[API /assessment/draft POST] Insert error:', insertError);
      return NextResponse.json({ message: 'Failed to create draft.' }, { status: 500, headers });
    }

    return NextResponse.json(
      {
        message: 'Draft created.',
        draftVersion: 1,
        lastSavedAt: nowString,
      },
      { status: 201, headers },
    );
  }
}

/**
 * DELETE /api/assessment/draft
 * Deletes any existing draft assessment for the user.
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

  const { error: deleteError } = await supabase
    .from('assessments')
    .delete()
    .eq('user_id', user.id)
    .eq('is_complete', false);

  if (deleteError) {
    console.error('[API /assessment/draft DELETE] Delete error:', deleteError);
    return NextResponse.json({ message: 'Failed to delete draft.' }, { status: 500, headers });
  }

  return NextResponse.json({ message: 'Draft deleted successfully.' }, { status: 200, headers });
}
