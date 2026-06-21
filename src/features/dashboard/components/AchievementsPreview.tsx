'use client';

import { useBadges } from '@/features/gamification/hooks/useBadges';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  ClipboardCheck,
  TrendingDown,
  Flame,
  Leaf,
  Trophy,
  Bike,
  Sun,
  Share2,
  MessageCircle,
  Award,
  Shield,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { AsyncBoundary } from '@/shared/components/AsyncBoundary';

const ICON_MAP: Record<string, LucideIcon> = {
  ClipboardCheck,
  TrendingDown,
  Flame,
  Leaf,
  Trophy,
  Bike,
  Sun,
  Share2,
  MessageCircle,
  Award,
};

export function AchievementsPreview() {
  const { user } = useAuth();
  const { allBadges, earnedSlugs, totalPoints, level, isLoading } = useBadges(user?.id ?? null);

  const earnedCount = earnedSlugs.size;

  // Filter to show top 5 badges (earned first, then locked)
  const displayBadges = [...allBadges]
    .sort((a, b) => {
      const aEarned = earnedSlugs.has(a.slug) ? 1 : 0;
      const bEarned = earnedSlugs.has(b.slug) ? 1 : 0;
      return bEarned - aEarned;
    })
    .slice(0, 5);

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <AsyncBoundary isLoading={isLoading}>
      <div className="space-y-4 rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Shield size={16} className="text-emerald-500" />
            <span>Achievements &amp; Level</span>
          </h3>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
            {totalPoints} Points
          </span>
        </div>

        <div className="space-y-4">
          {/* Level summary and progress */}
          <div className="flex items-center gap-3 rounded-xl border border-border/20 bg-muted/20 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white shadow-md shadow-emerald-500/10">
              Lv.{level.rank}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="truncate text-xs font-bold text-foreground">
                  {level.name} Level
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {level.maxPoints !== null
                    ? `${totalPoints} / ${level.maxPoints} pts`
                    : 'Max Level'}
                </span>
              </div>
              {/* Progress bar with ARIA properties */}
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  role="progressbar"
                  aria-valuenow={Math.round(level.progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progress to next level: ${level.name}`}
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${level.progress * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Badges preview row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Badges ({earnedCount} earned)</span>
              <span>Preview</span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-5 gap-2"
            >
              {displayBadges.map((badge) => {
                const isEarned = earnedSlugs.has(badge.slug);
                const Icon = ICON_MAP[badge.icon] || HelpCircle;
                return (
                  <motion.div
                    key={badge.slug}
                    variants={itemVariants}
                    className={`group relative flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all ${
                      isEarned
                        ? 'border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                        : 'border-border/40 bg-muted/10 text-muted-foreground opacity-50'
                    }`}
                  >
                    <Icon size={20} className="transition-transform group-hover:scale-110" />

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full z-30 mb-2 hidden w-40 rounded-lg border border-border bg-card p-2 text-center text-[10px] font-semibold text-foreground shadow-xl backdrop-blur-md group-hover:block">
                      <p className="font-extrabold text-foreground">{badge.name}</p>
                      <p className="mt-0.5 leading-relaxed text-muted-foreground">
                        {badge.description}
                      </p>
                      <p className="mt-1 font-bold text-emerald-500">+{badge.pointValue} pts</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </AsyncBoundary>
  );
}
