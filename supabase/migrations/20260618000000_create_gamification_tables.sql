-- Supabase Migration: Create Gamification Tables and Seed Badges
-- Date: 2026-06-18

-- 1. Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    xp_reward INTEGER NOT NULL,
    unlock_condition TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('assessment', 'coaching', 'simulation', 'community', 'sustainability_impact', 'streaks')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create user_points table (aggregates running totals per user)
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_points INTEGER DEFAULT 0 NOT NULL,
    lifetime_points INTEGER DEFAULT 0 NOT NULL,
    current_level INTEGER DEFAULT 1 NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Create user_badges table (links users to earned badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- 3b. Create points_transactions table (history log of point events)
CREATE TABLE IF NOT EXISTS public.points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    points INTEGER NOT NULL,
    awarded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Create database indexes for optimal querying
-- 4. Create database indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_current_level ON public.user_points(current_level);
CREATE INDEX IF NOT EXISTS idx_user_points_total_points ON public.user_points(total_points);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON public.user_badges(earned_at);
CREATE INDEX IF NOT EXISTS idx_user_badges_composite ON public.user_badges(user_id, badge_id);

CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON public.points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_awarded_at ON public.points_transactions(awarded_at);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- 6. Define RLS Policies
-- badges: Anyone authenticated can read, no client writes.
CREATE POLICY select_badges ON public.badges
    FOR SELECT TO authenticated USING (true);

-- user_points: User owns their point balance record.
CREATE POLICY select_user_points ON public.user_points
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY insert_user_points ON public.user_points
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_user_points ON public.user_points
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- user_badges: User owns their earned badges records.
CREATE POLICY select_user_badges ON public.user_badges
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY insert_user_badges ON public.user_badges
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- points_transactions: User owns their transactions log.
CREATE POLICY select_points_transactions ON public.points_transactions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY insert_points_transactions ON public.points_transactions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 7. Seed Badges Idempotently
INSERT INTO public.badges (id, slug, name, description, icon, xp_reward, unlock_condition, category)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'first_assessment', 'First Step', 'Complete your first carbon footprint assessment', 'ClipboardCheck', 50, 'complete_assessment', 'assessment'),
    ('b1000000-0000-0000-0000-000000000002', 'assessment_master', 'Assessment Master', 'Complete 5 carbon footprint assessments', 'GraduationCap', 150, 'complete_5_assessments', 'assessment'),
    ('b1000000-0000-0000-0000-000000000003', 'under_10t', 'Low Carbon Footprint', 'Achieve a carbon footprint under 10 tonnes CO₂/year', 'TrendingDown', 100, 'carbon_under_10t', 'sustainability_impact'),
    ('b1000000-0000-0000-0000-000000000004', 'under_2t', 'Net-Zero Champion', 'Achieve a carbon footprint under 2 tonnes CO₂/year', 'Award', 300, 'carbon_under_2t', 'sustainability_impact'),
    ('b1000000-0000-0000-0000-000000000005', 'ai_coach_explorer', 'Coach Explorer', 'Send your first message to the AI coach', 'MessageSquare', 20, 'coach_1_message', 'coaching'),
    ('b1000000-0000-0000-0000-000000000006', 'ai_coach_expert', 'Coach Expert', 'Send 10 messages to the AI coach', 'MessageCircle', 100, 'coach_10_messages', 'coaching'),
    ('b1000000-0000-0000-0000-000000000007', 'simulator_explorer', 'Simulator Explorer', 'Save your first scenario in the simulator', 'Play', 30, 'simulator_1_saved', 'simulation'),
    ('b1000000-0000-0000-0000-000000000008', 'simulator_master', 'Simulator Master', 'Save 5 scenarios in the simulator', 'Sliders', 120, 'simulator_5_saved', 'simulation'),
    ('b1000000-0000-0000-0000-000000000009', 'community_member', 'Community Member', 'Complete a community profile', 'Users', 50, 'joined_community', 'community'),
    ('b1000000-0000-0000-0000-000000000010', 'top_10_leaderboard', 'Top 10 Leaderboard', 'Reach the top 10 on the leaderboard', 'Trophy', 200, 'top_10_rank', 'community'),
    ('b1000000-0000-0000-0000-000000000011', 'eco_streak_7', '7-Day Streak', 'Maintain a 7-day daily activity streak', 'Flame', 75, 'streak_7_days', 'streaks'),
    ('b1000000-0000-0000-0000-000000000012', 'eco_streak_30', '30-Day Streak', 'Maintain a 30-day daily activity streak', 'Flame', 150, 'streak_30_days', 'streaks'),
    ('b1000000-0000-0000-0000-000000000013', 'eco_streak_90', '90-Day Streak', 'Maintain a 90-day daily activity streak', 'Flame', 300, 'streak_90_days', 'streaks'),
    ('b1000000-0000-0000-0000-000000000014', 'carbon_reducer', 'Carbon Reducer', 'Reduce your footprint compared to your previous assessment', 'Zap', 100, 'footprint_reduced', 'sustainability_impact'),
    ('b1000000-0000-0000-0000-000000000015', 'eco_hero', 'Eco Hero', 'Reach Level 6 (Green Hero)', 'Shield', 150, 'reach_level_6', 'sustainability_impact'),
    ('b1000000-0000-0000-0000-000000000016', 'vegan_switch', 'Plant Powered', 'Switch diet to vegan in simulator', 'Leaf', 50, 'vegan_switch', 'simulation')
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    xp_reward = EXCLUDED.xp_reward,
    unlock_condition = EXCLUDED.unlock_condition,
    category = EXCLUDED.category;
