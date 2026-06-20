'use client';

import { Activity, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { AssessmentRecord } from '@/features/dashboard/types/dashboard.types';
import { motion, type Variants } from 'framer-motion';

interface InsightsPanelProps {
  readonly latestAssessment: AssessmentRecord;
}

interface InsightItem {
  readonly id: string;
  readonly category: string;
  readonly message: string;
  readonly saving: string;
  readonly priority: 'high' | 'medium' | 'low';
}

export function InsightsPanel({ latestAssessment }: InsightsPanelProps) {
  const insights: InsightItem[] = [];

  if (latestAssessment.transport_kg > 1500) {
    insights.push({
      id: 'insight-transport',
      category: 'Transport',
      message: 'Your vehicle emissions are higher than regional sustainability targets.',
      saving: 'Save up to 600kg CO₂/yr by carpooling or hybrid transition',
      priority: 'high',
    });
  }

  if (latestAssessment.energy_kg > 1500) {
    insights.push({
      id: 'insight-energy',
      category: 'Energy',
      message: 'Home heating and electricity comprise a significant portion of your footprint.',
      saving: 'Save up to 1,200kg CO₂/yr by switching to 100% solar/renewable energy',
      priority: 'high',
    });
  }

  if (latestAssessment.diet_kg >= 2500) {
    insights.push({
      id: 'insight-diet',
      category: 'Diet',
      message: 'Emissions from meat consumption are relatively high in your diet profile.',
      saving: 'Save up to 800kg CO₂/yr by shifting toward plant-based meal schedules',
      priority: 'medium',
    });
  }

  if (latestAssessment.travel_kg > 1000) {
    insights.push({
      id: 'insight-travel',
      category: 'Travel',
      message: 'Frequent flight mileage has significantly elevated your travel emissions.',
      saving: 'Save up to 1,000kg CO₂/yr by selecting regional train alternatives',
      priority: 'medium',
    });
  }

  if (latestAssessment.shopping_kg >= 1200) {
    insights.push({
      id: 'insight-shopping',
      category: 'Shopping',
      message:
        'New consumer goods and fast fashion options have increased your consumption footprint.',
      saving: 'Save up to 400kg CO₂/yr by repairing items or purchasing secondhand',
      priority: 'low',
    });
  }

  // Fallbacks if user is extremely sustainable
  if (insights.length === 0) {
    insights.push({
      id: 'insight-fallback',
      category: 'Lifestyle',
      message:
        'Incredible job! Your emissions across all categories are below sustainable thresholds.',
      saving: 'Offset your remaining footprint to achieve net-zero status',
      priority: 'low',
    });
  }

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Activity size={16} className="text-emerald-500" />
          <span>Sustainability Insights</span>
        </h3>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          Action Recommended
        </span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {insights.map((item) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/50 p-4 transition-colors hover:border-emerald-500/20 hover:bg-muted/10"
          >
            <div className="mt-0.5">
              {item.priority === 'high' ? (
                <ShieldAlert size={16} className="text-red-500" />
              ) : (
                <CheckCircle2 size={16} className="text-yellow-500" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  {item.category}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                    item.priority === 'high'
                      ? 'bg-red-500/10 text-red-500'
                      : item.priority === 'medium'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-emerald-500/10 text-emerald-500'
                  }`}
                >
                  {item.priority} priority
                </span>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-foreground">
                {item.message}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <span>{item.saving}</span>
                <ArrowRight size={12} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
