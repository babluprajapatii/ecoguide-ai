-- Supabase Migration: Community & Leaderboard System (Phase 8)
-- Date: 2026-06-18

-- 1. Extend community_profiles with leaderboard and visibility columns
ALTER TABLE public.community_profiles
  ADD COLUMN IF NOT EXISTS leaderboard_opt_in BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS public_profile_visibility TEXT DEFAULT 'public' NOT NULL
    CHECK (public_profile_visibility IN ('public', 'hidden')),
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '' NOT NULL;

-- 2. Create partial indexes on community_profiles for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_community_profiles_leaderboard
  ON public.community_profiles(leaderboard_opt_in)
  WHERE leaderboard_opt_in = true;

CREATE INDEX IF NOT EXISTS idx_community_profiles_visibility
  ON public.community_profiles(public_profile_visibility)
  WHERE public_profile_visibility = 'public';

-- 3. Add leaderboard-optimized composite index on user_points
CREATE INDEX IF NOT EXISTS idx_user_points_leaderboard_rank
  ON public.user_points(total_points DESC, current_level DESC, longest_streak DESC);

-- 4. EXISTS-based RLS policy on user_points for leaderboard reads
-- Users can read other users' points ONLY if those users have opted in to the leaderboard
CREATE POLICY select_leaderboard_user_points ON public.user_points
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.community_profiles cp
      WHERE cp.id = user_points.user_id
        AND cp.leaderboard_opt_in = true
        AND cp.public_profile_visibility = 'public'
    )
  );

-- 5. leaderboard_rank_cache table (server-refreshed periodically)
CREATE TABLE IF NOT EXISTS public.leaderboard_rank_cache (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  previous_rank INTEGER,
  rank_change INTEGER DEFAULT 0 NOT NULL,
  total_points INTEGER NOT NULL,
  current_level INTEGER NOT NULL,
  longest_streak INTEGER NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  badge_count INTEGER DEFAULT 0 NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank_cache_rank
  ON public.leaderboard_rank_cache(rank ASC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank_cache_points
  ON public.leaderboard_rank_cache(total_points DESC);

ALTER TABLE public.leaderboard_rank_cache ENABLE ROW LEVEL SECURITY;

-- Public read for all authenticated users (only contains opted-in public data)
CREATE POLICY select_leaderboard_cache ON public.leaderboard_rank_cache
  FOR SELECT TO authenticated USING (true);

-- Server-side writes only (service role) — no client insert/update/delete policies

-- 6. community_stats_cache table (single-row aggregate cache)
CREATE TABLE IF NOT EXISTS public.community_stats_cache (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_users INTEGER DEFAULT 0 NOT NULL,
  active_users_7d INTEGER DEFAULT 0 NOT NULL,
  total_xp_earned BIGINT DEFAULT 0 NOT NULL,
  assessments_completed INTEGER DEFAULT 0 NOT NULL,
  simulations_saved INTEGER DEFAULT 0 NOT NULL,
  badges_earned INTEGER DEFAULT 0 NOT NULL,
  avg_carbon_footprint NUMERIC(10,2) DEFAULT 0 NOT NULL,
  top_carbon_saver_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  top_carbon_saver_name TEXT,
  top_carbon_saver_score NUMERIC(10,2) DEFAULT 0,
  most_improved_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  most_improved_name TEXT,
  most_improved_reduction NUMERIC(10,2) DEFAULT 0,
  longest_streak_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  longest_streak_name TEXT,
  longest_streak_days INTEGER DEFAULT 0,
  cached_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.community_stats_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_community_stats ON public.community_stats_cache
  FOR SELECT TO authenticated USING (true);

-- Insert the initial row
INSERT INTO public.community_stats_cache (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- 7. leaderboard_seasons table (for future seasonal rankings)
CREATE TABLE IF NOT EXISTS public.leaderboard_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_season_dates CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_seasons_active
  ON public.leaderboard_seasons(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_leaderboard_seasons_dates
  ON public.leaderboard_seasons(starts_at, ends_at);

ALTER TABLE public.leaderboard_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_leaderboard_seasons ON public.leaderboard_seasons
  FOR SELECT TO authenticated USING (true);
