'use client';

import { useEffect, useState } from 'react';
import {
  Footprints,
  TrendingDown,
  Sun,
  TrendingUp,
  Award,
  Trophy,
  TreePine,
  Droplets,
  Zap,
  Heart,
  Wind,
  Leaf,
  Plus,
} from 'lucide-react';
import { useMounted } from '@/shared/hooks/use-mounted';

interface CounterProps {
  target: number;
  decimals?: number;
  duration?: number;
}

function AnimatedCounter({ target, decimals = 0, duration = 2000 }: CounterProps) {
  const [count, setCount] = useState(0);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;

    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing out function
      const easeOutQuad = (t: number) => t * (2 - t);
      const easedProgress = easeOutQuad(progress);

      setCount(easedProgress * target);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [target, duration, mounted]);

  if (!mounted) return <span>0</span>;
  return <span>{count.toFixed(decimals)}</span>;
}

export function Metrics() {
  const mounted = useMounted();

  return (
    <section
      id="dashboard"
      className="relative overflow-hidden border-t border-eco-500/10 bg-dark-900 py-20 md:py-32"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-eco-400">
            Live Dashboard
          </span>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-white md:text-5xl">
            Your Impact at a <span className="text-gradient">Glance</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-light text-stone-400">
            Real-time metrics that track your carbon reduction, clean energy usage, and community
            standing.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Carbon Footprint */}
          <div className="stat-card glass-card rounded-2xl p-8 transition-transform duration-300">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-eco-500/10">
                <Footprints className="h-6 w-6 text-eco-400" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-eco-500/10 px-2.5 py-1 text-xs font-semibold text-eco-400">
                <TrendingDown className="h-3.5 w-3.5" />
                12%
              </span>
            </div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-stone-500">
              Carbon Footprint
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-4xl font-semibold text-white">
                <AnimatedCounter target={2.4} decimals={1} />
              </span>
              <span className="text-sm text-stone-500">tons CO₂/mo</span>
            </div>
            {/* Mini Chart */}
            <div className="mt-6 flex h-12 items-end gap-1">
              {[60, 80, 70, 55, 50, 45, 40, 35, 30, 25].map((height, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all duration-1000 ${
                    i === 9 ? 'bg-eco-400' : i >= 7 ? 'bg-eco-500/40' : 'bg-eco-500/20'
                  }`}
                  style={{ height: mounted ? `${height}%` : '10%' }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-eco-400/60">Monthly decline trend ↓</p>
          </div>

          {/* Clean Energy */}
          <div className="stat-card glass-card rounded-2xl p-8 transition-transform duration-300 [animation-delay:1s]">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <Sun className="h-6 w-6 text-amber-400" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
                <TrendingUp className="h-3.5 w-3.5" />
                8%
              </span>
            </div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-stone-500">
              Clean Energy Share
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-4xl font-semibold text-white">
                <AnimatedCounter target={84.2} decimals={1} />
              </span>
              <span className="text-sm text-stone-500">%</span>
            </div>
            {/* Circular Progress */}
            <div className="mt-6 flex justify-center">
              <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90 transform">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="rgba(16,185,129,0.1)"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="url(#ecoGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="213.6"
                  strokeDashoffset={mounted ? `${213.6 - (213.6 * 84.2) / 100}` : '213.6'}
                  className="progress-ring"
                />
                <defs>
                  <linearGradient id="ecoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#10b981' }} />
                    <stop offset="100%" style={{ stopColor: '#fbbf24' }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="mt-3 text-center text-xs text-amber-400/60">Weekly growth ↑</p>
          </div>

          {/* Offset Badges */}
          <div className="stat-card glass-card rounded-2xl p-8 transition-transform duration-300 [animation-delay:2s]">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <Award className="h-6 w-6 text-purple-400" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-400">
                <Trophy className="h-3.5 w-3.5" />
                Top 5%
              </span>
            </div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-stone-500">
              Offset Badges
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-4xl font-semibold text-white">
                <AnimatedCounter target={12} decimals={0} />
              </span>
              <span className="text-sm text-stone-500">badges earned</span>
            </div>
            {/* Badge Grid */}
            <div className="mt-6 grid grid-cols-4 gap-2">
              {[
                { icon: TreePine, color: 'text-eco-400', bg: 'bg-eco-500/10', label: 'Forest' },
                { icon: Sun, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Solar' },
                { icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Water' },
                { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Energy' },
                { icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Community' },
                { icon: Wind, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Wind' },
                { icon: Leaf, color: 'text-eco-400', bg: 'bg-eco-500/10', label: 'Organic' },
              ].map((badge, idx) => {
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={idx}
                    className={`aspect-square w-full rounded-lg ${badge.bg} flex items-center justify-center ${badge.color}`}
                    title={badge.label}
                  >
                    <BadgeIcon className="h-4 w-4" />
                  </div>
                );
              })}
              <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-dark-600 text-stone-400">
                <Plus className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-xs text-purple-400/60">Community ranking ↑</p>
          </div>
        </div>
      </div>
    </section>
  );
}
