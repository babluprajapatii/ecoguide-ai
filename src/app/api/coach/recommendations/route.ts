import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const recommendationCategorySchema = z.enum(['high', 'medium', 'low']);
const recommendationStatusSchema = z.enum(['pending', 'completed', 'dismissed']);

const createRecommendationSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(5).max(500),
  priority: recommendationCategorySchema,
  estimated_savings: z.number().nonnegative(),
});

const updateRecommendationSchema = z.object({
  id: z.string().uuid(),
  status: recommendationStatusSchema,
});

/**
 * GET /api/coach/recommendations
 * Loads recommendations. Seeds once based on highest carbon footprint category if empty.
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

    // 1. Fetch current recommendations
    const { data: currentRecs, error: fetchError } = await supabase
      .from('coach_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error('[API /api/coach/recommendations GET] Database fetch error', fetchError, { userId: user.id });
      return NextResponse.json({ message: 'Failed to query recommendations.' }, { status: 500 });
    }

    if (currentRecs && currentRecs.length > 0) {
      return NextResponse.json(currentRecs, { status: 200 });
    }

    // 2. No recommendations exist yet: Seed recommendations idempotently based on highest category
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('transport_score, diet_score, energy_score, shopping_score, travel_score, transport_kg, diet_kg, energy_kg, shopping_kg, total_kg')
      .eq('is_complete', true)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let highestCategory = 'default';
    if (!assessmentError && assessment) {
      const cats = [
        { name: 'transport', val: Number(assessment.transport_score ?? assessment.transport_kg ?? 0) },
        { name: 'diet', val: Number(assessment.diet_score ?? assessment.diet_kg ?? 0) },
        { name: 'energy', val: Number(assessment.energy_score ?? assessment.energy_kg ?? 0) },
        { name: 'shopping', val: Number(assessment.shopping_score ?? assessment.shopping_kg ?? 0) },
        { name: 'travel', val: Number(assessment.travel_score ?? 0) },
      ];
      highestCategory = cats.reduce((prev, curr) => (curr.val > prev.val ? curr : prev)).name;
    }

    const defaultSeedData: Record<string, Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low'; estimated_savings: number }>> = {
      transport: [
        {
          title: 'Switch to Public Transit or Bike Commutes',
          description: 'Shifting at least 50% of your weekly driving miles to public transit or cycling can save up to 600kg CO₂/year.',
          priority: 'high',
          estimated_savings: 600,
        },
        {
          title: 'Form Commute Carpools',
          description: 'Carpooling with coworkers for weekly commutes can share emissions and reduce footprint by 300kg CO₂/year.',
          priority: 'medium',
          estimated_savings: 300,
        },
        {
          title: 'Maintain Eco-Driving Practices',
          description: 'Using cruise control, keeping tires properly inflated, and avoiding aggressive acceleration saves up to 100kg CO₂/year.',
          priority: 'low',
          estimated_savings: 100,
        },
      ],
      energy: [
        {
          title: 'Upgrade to Renewable Utility Plan',
          description: 'Switching your electricity account to a 100% wind/solar green utility plan offsets up to 1,200kg CO₂/year.',
          priority: 'high',
          estimated_savings: 1200,
        },
        {
          title: 'Install a Smart Thermostat',
          description: 'Smart thermostats automatically manage HVAC heating and cooling to reduce wasted energy, saving 400kg CO₂/year.',
          priority: 'medium',
          estimated_savings: 400,
        },
        {
          title: 'Install LED Lighting',
          description: 'Replacing standard incandescent bulbs with LED alternatives across high-use areas saves 100kg CO₂/year.',
          priority: 'low',
          estimated_savings: 100,
        },
      ],
      diet: [
        {
          title: 'Adopt Vegetarian Days',
          description: 'Shifting to vegetarian or plant-based meals at least 3-4 days a week reduces food-related emissions by 800kg CO₂/year.',
          priority: 'high',
          estimated_savings: 800,
        },
        {
          title: 'Minimize Red Meat Purchases',
          description: 'Beef and lamb produce high methane emissions. Swapping red meat for poultry or seafood saves 400kg CO₂/year.',
          priority: 'medium',
          estimated_savings: 400,
        },
        {
          title: 'Compost Organic Scraps',
          description: 'Composting food waste prevents organic matter from producing landfill methane, saving up to 150kg CO₂/year.',
          priority: 'low',
          estimated_savings: 150,
        },
      ],
      travel: [
        {
          title: 'Choose Rail Over Short Flights',
          description: 'Selecting trains instead of regional flight connections reduces transit footprint by 1,000kg CO₂/year.',
          priority: 'high',
          estimated_savings: 1000,
        },
        {
          title: 'Select Green-Certified Hotels',
          description: 'Staying at hotels with LEED certifications, solar installations, and low-waste laundry saves 300kg CO₂/year.',
          priority: 'medium',
          estimated_savings: 300,
        },
        {
          title: 'Consolidate Flight Itineraries',
          description: 'Combining business or leisure trips to reduce flight frequency saves up to 200kg CO₂/year.',
          priority: 'low',
          estimated_savings: 200,
        },
      ],
      default: [
        {
          title: 'Practice Mindful Shopping Habits',
          description: 'Opting out of fast fashion, repairing existing garments, and buying secondhand items saves 400kg CO₂/year.',
          priority: 'high',
          estimated_savings: 400,
        },
        {
          title: 'Choose Refurbished Tech',
          description: 'Buying certified secondhand electronics instead of brand new devices saves 200kg CO₂/year.',
          priority: 'medium',
          estimated_savings: 200,
        },
        {
          title: 'Repair Household Goods First',
          description: 'Extending product lifecycles by repairing appliances before replacing them saves 100kg CO₂/year.',
          priority: 'low',
          estimated_savings: 100,
        },
      ],
    };

    const seeds = defaultSeedData[highestCategory] || defaultSeedData.default;

    const formattedSeeds = seeds!.map((rec) => ({
      user_id: user.id,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      estimated_savings: rec.estimated_savings,
      status: 'pending',
    }));

    // Idempotent insertion using a select check on title to handle concurrency safely
    const { data: insertedRecs, error: insertError } = await supabase
      .from('coach_recommendations')
      .insert(formattedSeeds)
      .select('*');

    if (insertError) {
      logger.warn('Failed to insert seeded recommendations due to concurrency, fetching existing', { userId: user.id });
      const { data: fallbackFetch } = await supabase
        .from('coach_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return NextResponse.json(fallbackFetch || [], { status: 200 });
    }

    logger.info('Idempotently seeded coach recommendations', { userId: user.id, category: highestCategory });

    return NextResponse.json(insertedRecs || [], { status: 201 });
  } catch (error) {
    logger.error('[API /api/coach/recommendations GET] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * POST /api/coach/recommendations
 * Creates a new custom recommended action.
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

    const body = await request.json();
    const parseResult = createRecommendationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { message: 'Validation failed.', errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, priority, estimated_savings } = parseResult.data;

    const { data: newRecommendation, error: insertError } = await supabase
      .from('coach_recommendations')
      .insert({
        user_id: user.id,
        title,
        description,
        priority,
        estimated_savings,
        status: 'pending',
      })
      .select('*')
      .single();

    if (insertError) {
      logger.error('[API /api/coach/recommendations POST] Insert error', insertError, { userId: user.id });
      return NextResponse.json({ message: 'Failed to create recommended action.' }, { status: 500 });
    }

    logger.info('Custom recommendation created', { userId: user.id, recId: newRecommendation.id });

    return NextResponse.json(newRecommendation, { status: 201 });
  } catch (error) {
    logger.error('[API /api/coach/recommendations POST] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * PUT /api/coach/recommendations
 * Updates the status of a recommended action ('pending', 'completed', 'dismissed').
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
    const parseResult = updateRecommendationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { message: 'Validation failed.', errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, status } = parseResult.data;

    // Verify ownership first
    const { data: existingRec, error: fetchError } = await supabase
      .from('coach_recommendations')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingRec) {
      return NextResponse.json({ message: 'Recommended action not found.' }, { status: 404 });
    }

    if (existingRec.user_id !== user.id) {
      return NextResponse.json({ message: 'Forbidden: You do not own this recommended action.' }, { status: 403 });
    }

    // Update status
    const { data: updatedRec, error: updateError } = await supabase
      .from('coach_recommendations')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      logger.error('[API /api/coach/recommendations PUT] Update error', updateError, { userId: user.id, recId: id });
      return NextResponse.json({ message: 'Failed to update recommended action.' }, { status: 500 });
    }

    logger.info('Recommendation status updated', { userId: user.id, recId: id, status });

    return NextResponse.json(updatedRec, { status: 200 });
  } catch (error) {
    logger.error('[API /api/coach/recommendations PUT] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * DELETE /api/coach/recommendations
 * Deletes a recommended action. Accepts `id` in query parameters.
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
      return NextResponse.json({ message: 'Missing recommended action ID.' }, { status: 400 });
    }

    // Verify ownership first
    const { data: existingRec, error: fetchError } = await supabase
      .from('coach_recommendations')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingRec) {
      return NextResponse.json({ message: 'Recommended action not found.' }, { status: 404 });
    }

    if (existingRec.user_id !== user.id) {
      return NextResponse.json({ message: 'Forbidden: You do not own this recommended action.' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('coach_recommendations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('[API /api/coach/recommendations DELETE] Delete error', deleteError, { userId: user.id, recId: id });
      return NextResponse.json({ message: 'Failed to delete recommended action.' }, { status: 500 });
    }

    logger.info('Recommendation deleted', { userId: user.id, recId: id });

    return NextResponse.json({ message: 'Recommended action deleted successfully.' }, { status: 200 });
  } catch (error) {
    logger.error('[API /api/coach/recommendations DELETE] Critical error', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
