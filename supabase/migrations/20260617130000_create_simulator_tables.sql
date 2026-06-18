-- Migration: Create Saved Simulations Table
-- Date: 2026-06-17

-- 1. Create saved_simulations Table
CREATE TABLE IF NOT EXISTS public.saved_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scenario_name TEXT NOT NULL,
    scenario_type TEXT NOT NULL CHECK (scenario_type IN ('ev', 'solar', 'diet', 'flights', 'shopping', 'custom')),
    configuration JSONB NOT NULL,
    estimated_carbon_savings NUMERIC NOT NULL,
    estimated_cost_savings NUMERIC NOT NULL,
    estimated_water_savings NUMERIC NOT NULL DEFAULT 0,
    estimated_energy_savings NUMERIC NOT NULL DEFAULT 0,
    impact_score INTEGER NOT NULL CHECK (impact_score BETWEEN 0 AND 100),
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    comparison_group_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Indexes for Optimization
CREATE INDEX IF NOT EXISTS saved_simulations_user_id_idx ON public.saved_simulations(user_id);
CREATE INDEX IF NOT EXISTS saved_simulations_created_at_idx ON public.saved_simulations(created_at DESC);
CREATE INDEX IF NOT EXISTS saved_simulations_scenario_type_idx ON public.saved_simulations(scenario_type);
CREATE INDEX IF NOT EXISTS saved_simulations_comparison_group_idx ON public.saved_simulations(comparison_group_id);
CREATE INDEX IF NOT EXISTS saved_simulations_user_created_idx ON public.saved_simulations(user_id, created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.saved_simulations ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for saved_simulations
CREATE POLICY select_own_simulations ON public.saved_simulations
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY insert_own_simulations ON public.saved_simulations
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_simulations ON public.saved_simulations
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY delete_own_simulations ON public.saved_simulations
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Add trigger to update updated_at automatically
CREATE OR REPLACE TRIGGER handle_saved_simulations_updated_at
    BEFORE UPDATE ON public.saved_simulations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
