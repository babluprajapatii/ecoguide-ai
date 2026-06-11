import { createClient } from '@/lib/supabase/server';

/**
 * Fetches the user's latest assessment and determines their highest carbon footprint category.
 * Used by the coach page Server Component for server-side hydration.
 *
 * @returns The highest footprint category name ('Transport', 'Diet', 'Energy', 'Shopping'),
 *          or 'default' if the user has no assessments or client is unconfigured.
 */
export async function fetchUserHighestCategory(): Promise<string> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return 'default';
    }

    const { data: rows, error } = await supabase
      .from('assessments')
      .select('transport_kg, diet_kg, energy_kg, shopping_kg')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !rows || rows.length === 0) {
      return 'default';
    }

    const latest = rows[0];
    if (!latest) {
      return 'default';
    }

    const categories = [
      { name: 'Transport', value: latest.transport_kg },
      { name: 'Diet', value: latest.diet_kg },
      { name: 'Energy', value: latest.energy_kg },
      { name: 'Shopping', value: latest.shopping_kg },
    ];

    const highest = categories.reduce((prev, current) =>
      current.value > prev.value ? current : prev,
    );

    return highest.name;
  } catch (error) {
    console.warn(
      '[CoachService] Supabase client unconfigured or query failed. Returning fallback:',
      error,
    );
    return 'default';
  }
}
