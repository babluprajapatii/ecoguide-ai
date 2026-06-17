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

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25 animate-pulse h-[300px]" />
    );
  }

  const earnedCount = earnedSlugs.size;

  // Filter to show top 5 badges (earned first, then locked)
  const displayBadges = [...allBadges].sort((a, b) => {
    const aEarned = earnedSlugs.has(a.slug) ? 1 : 0;
    const bEarned = earnedSlugs.has(b.slug) ? 1 : 0;
    return bEarned - aEarned;
  }).slice(0, 5);

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
    <div className="rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Shield size={16} className="text-emerald-500" />
          <span>Achievements &amp; Level</span>
        </h3>
        <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {totalPoints} Points
        </span>
      </div>

      <div className="space-y-4">
        {/* Level summary and progress */}
        <div className="flex items-center gap-3 bg-muted/20 border border-border/20 rounded-xl p-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white font-black text-sm shadow-md shadow-emerald-500/10">
            Lv.{level.rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-foreground truncate">{level.name} Level</span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {level.maxPoints !== null ? `${totalPoints} / ${level.maxPoints} pts` : 'Max Level'}
              </span>
            </div>
            {/* Progress bar with ARIA properties */}
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden mt-1.5">
              <div
                role="progressbar"
                aria-valuenow={Math.round(level.progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress to next level: ${level.name}`}
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${level.progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badges preview row */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
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
                  className={`group relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                    isEarned
                      ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted/10 border-border/40 text-muted-foreground opacity-50'
                  }`}
                >
                  <Icon size={20} className="transition-transform group-hover:scale-110" />

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-40 p-2 text-center text-[10px] font-semibold bg-card border border-border text-foreground rounded-lg shadow-xl backdrop-blur-md z-30">
                    <p className="font-extrabold text-foreground">{badge.name}</p>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">{badge.description}</p>
                    <p className="text-emerald-500 mt-1 font-bold">+{badge.pointValue} pts</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
