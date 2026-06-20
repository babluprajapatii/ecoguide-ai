'use client';

import { Leaf, Award, Compass, Zap, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { AssessmentRecord } from '@/features/dashboard/types/dashboard.types';
import { calculateGradeFromEmissions } from '../services/analytics.service';
import { motion, type Variants } from 'framer-motion';

interface SummaryCardsProps {
  readonly latestAssessment: AssessmentRecord;
  readonly savingsTotal: number;
  readonly history: readonly AssessmentRecord[];
}

function formatKg(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}t`;
  }
  return `${Math.round(kg)} kg`;
}

export function SummaryCards({ latestAssessment, savingsTotal, history }: SummaryCardsProps) {
  const grade = calculateGradeFromEmissions(latestAssessment.total_kg);

  // Calculate trends by comparing to previous assessment in history
  let totalTrend: number | null = null;
  let percentileTrend: number | null = null;

  if (history.length > 1) {
    const prev = history[history.length - 2];
    if (prev) {
      totalTrend = ((latestAssessment.total_kg - prev.total_kg) / prev.total_kg) * 100;
      percentileTrend = latestAssessment.percentile - prev.percentile;
    }
  }

  const cards = [
    {
      title: 'Total Carbon Footprint',
      value: formatKg(latestAssessment.total_kg),
      subtext: 'CO₂ emissions per year',
      icon: Leaf,
      iconColor: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20',
      trend:
        totalTrend !== null
          ? {
              value: `${Math.abs(totalTrend).toFixed(1)}%`,
              isGood: totalTrend < 0,
              text: totalTrend < 0 ? 'decrease' : 'increase',
            }
          : null,
    },
    {
      title: 'Assessment Carbon Grade',
      value: grade,
      subtext: 'Based on raw emissions',
      icon: Award,
      iconColor: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/20',
      trend: {
        value: grade.includes('+') || grade === 'A' ? 'Eco Hero' : 'Active Track',
        isGood: true,
        text: '',
      },
    },
    {
      title: 'Community Percentile',
      value: `${latestAssessment.percentile}th`,
      subtext: 'Percentile (lower is better)',
      icon: Compass,
      iconColor: 'text-purple-500 bg-purple-500/10 dark:bg-purple-500/20',
      trend:
        percentileTrend !== null
          ? {
              value: `${Math.abs(percentileTrend)} ranks`,
              isGood: percentileTrend < 0,
              text: percentileTrend < 0 ? 'improved' : 'regression',
            }
          : null,
    },
    {
      title: 'Estimated Reduction Potential',
      value: formatKg(savingsTotal),
      subtext: 'Achievable annual savings',
      icon: Zap,
      iconColor: 'text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20',
      trend: {
        value: `${((savingsTotal / latestAssessment.total_kg) * 100).toFixed(0)}%`,
        isGood: true,
        text: 'potential saving',
      },
    },
  ];

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            variants={cardVariants}
            className="group relative rounded-2xl border border-border/80 bg-card/40 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:border-emerald-500/20 hover:shadow-md dark:bg-card/25"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-tight text-muted-foreground">
                {card.title}
              </span>
              <div
                className={`rounded-xl p-2.5 ${card.iconColor} transition-transform group-hover:scale-110`}
              >
                <Icon size={18} />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-foreground">
                {card.value}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{card.subtext}</span>
              {card.trend && (
                <div
                  className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold ${
                    card.trend.isGood
                      ? 'bg-emerald-500/5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-red-500/5 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                  }`}
                >
                  {card.trend.isGood ? (
                    <ArrowDownRight size={12} className="inline" />
                  ) : (
                    <ArrowUpRight size={12} className="inline" />
                  )}
                  <span>{card.trend.value}</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
