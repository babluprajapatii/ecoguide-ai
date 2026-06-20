'use client';

import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle2 } from 'lucide-react';

interface RecommendationsListProps {
  recommendations: readonly string[];
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <Lightbulb className="h-5 w-5" />
        <h3 className="text-lg font-bold text-foreground">Personalized Action Guide</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Our Sustainability Engine suggests the following actions based on your footprint breakdown
        to help lower your emissions:
      </p>

      <ul className="space-y-3 pt-2">
        {recommendations.map((rec, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/50 p-4 transition-colors hover:border-emerald-500/20"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <span className="text-sm leading-relaxed text-foreground">{rec}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
