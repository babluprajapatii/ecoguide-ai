'use client';

import { motion } from 'framer-motion';
import { Leaf, ArrowRight, Zap, Car, UtensilsCrossed, ShoppingBag, Plane } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 text-center"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
        <Leaf className="h-8 w-8" />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Measure Your Carbon Footprint
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          EcoGuide AI helps you calculate, track, and reduce your personal greenhouse gas emissions.
          Answer a few questions about your lifestyle to get a detailed breakdown.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-left sm:grid-cols-5">
        <div className="rounded-xl border border-border p-4 text-center transition-colors hover:border-emerald-500/30">
          <Car className="mx-auto mb-2 h-6 w-6 text-blue-500" />
          <span className="block text-xs font-semibold">Transport</span>
        </div>
        <div className="rounded-xl border border-border p-4 text-center transition-colors hover:border-emerald-500/30">
          <Zap className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
          <span className="block text-xs font-semibold">Energy</span>
        </div>
        <div className="rounded-xl border border-border p-4 text-center transition-colors hover:border-emerald-500/30">
          <UtensilsCrossed className="mx-auto mb-2 h-6 w-6 text-red-500" />
          <span className="block text-xs font-semibold">Diet</span>
        </div>
        <div className="rounded-xl border border-border p-4 text-center transition-colors hover:border-emerald-500/30">
          <ShoppingBag className="mx-auto mb-2 h-6 w-6 text-purple-500" />
          <span className="block text-xs font-semibold">Shopping</span>
        </div>
        <div className="rounded-xl border border-border p-4 text-center transition-colors hover:border-emerald-500/30">
          <Plane className="mx-auto mb-2 h-6 w-6 text-teal-500" />
          <span className="block text-xs font-semibold">Travel</span>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-lg active:scale-95 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          Start Assessment
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
}
