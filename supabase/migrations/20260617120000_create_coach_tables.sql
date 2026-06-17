-- Migration: Create Coach Conversations and Recommendations Tables
-- Date: 2026-06-17

-- 1. Create coach_conversations Table
CREATE TABLE IF NOT EXISTS public.coach_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create coach_recommendations Table
CREATE TABLE IF NOT EXISTS public.coach_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    estimated_savings INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Indexes for Optimization and Performance
CREATE INDEX IF NOT EXISTS coach_conversations_user_id_idx ON public.coach_conversations(user_id);
CREATE INDEX IF NOT EXISTS coach_conversations_created_at_idx ON public.coach_conversations(created_at);
CREATE INDEX IF NOT EXISTS coach_conversations_user_created_idx ON public.coach_conversations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS coach_recommendations_user_id_idx ON public.coach_recommendations(user_id);
CREATE INDEX IF NOT EXISTS coach_recommendations_status_idx ON public.coach_recommendations(status);
CREATE INDEX IF NOT EXISTS coach_recommendations_user_status_idx ON public.coach_recommendations(user_id, status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_recommendations ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for coach_conversations
CREATE POLICY select_own_conversations ON public.coach_conversations
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY insert_own_conversations ON public.coach_conversations
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_conversations ON public.coach_conversations
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY delete_own_conversations ON public.coach_conversations
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. Create RLS Policies for coach_recommendations
CREATE POLICY select_own_recommendations ON public.coach_recommendations
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY insert_own_recommendations ON public.coach_recommendations
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_recommendations ON public.coach_recommendations
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY delete_own_recommendations ON public.coach_recommendations
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. Create Postgres Trigger to maintain 100-message limit per user
CREATE OR REPLACE FUNCTION public.prune_old_conversations()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.coach_conversations
    WHERE user_id = NEW.user_id
      AND id NOT IN (
        SELECT id FROM public.coach_conversations
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        LIMIT 100
      );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_prune_old_conversations
    AFTER INSERT ON public.coach_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.prune_old_conversations();

-- 8. Add trigger to update updated_at timestamps automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER handle_coach_conversations_updated_at
    BEFORE UPDATE ON public.coach_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER handle_coach_recommendations_updated_at
    BEFORE UPDATE ON public.coach_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
