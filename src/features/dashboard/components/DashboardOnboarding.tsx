'use client';

import { ArrowRight, ClipboardCheck, Sparkles, BarChart2 } from 'lucide-react';
import Link from 'next/link';

export function DashboardOnboarding() {
  return (
    <div className="space-y-6">
      {/* Welcome / Onboarding Card */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 md:p-8 shadow-sm backdrop-blur-md dark:bg-emerald-500/5">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />

        <div className="relative flex flex-col md:flex-row items-center gap-6 md:justify-between">
          <div className="space-y-3 flex-1 text-center md:text-left">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Sparkles size={18} className="animate-spin-slow" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Start Your Sustainability Journey
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              You haven&apos;t completed your carbon assessment yet. Take our simple 7-step wizard to calculate your personal footprint, unlock custom goal tracking, compare standings on the community leaderboard, and access our AI coach.
            </p>
          </div>

          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-md shadow-emerald-600/20 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <span>Take Your First Assessment</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Locked dashboard widget previews */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Locked Analytics Preview */}
        <div className="relative rounded-2xl border border-border bg-card/20 p-6 opacity-60 pointer-events-none">
          <div className="absolute inset-0 bg-card/20 backdrop-blur-[1.5px] z-10 flex flex-col items-center justify-center text-center p-4">
            <BarChart2 size={24} className="text-muted-foreground mb-2" />
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
              Charts locked
            </span>
          </div>
          <div className="h-10 w-32 bg-muted rounded mb-4 animate-pulse" />
          <div className="h-44 bg-muted/60 rounded animate-pulse" />
        </div>

        {/* Locked Goals Preview */}
        <div className="relative rounded-2xl border border-border bg-card/20 p-6 opacity-60 pointer-events-none">
          <div className="absolute inset-0 bg-card/20 backdrop-blur-[1.5px] z-10 flex flex-col items-center justify-center text-center p-4">
            <ClipboardCheck size={24} className="text-muted-foreground mb-2" />
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
              Goal Tracking locked
            </span>
          </div>
          <div className="h-10 w-28 bg-muted rounded mb-4 animate-pulse" />
          <div className="h-44 bg-muted/60 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
