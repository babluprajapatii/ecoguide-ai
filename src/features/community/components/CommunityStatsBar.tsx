'use client';

import React, { useEffect, useState } from 'react';
import { useCommunityStats } from '../hooks/useCommunityStats';

function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.floor(value);
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMiliseconds = duration;
    const incrementTime = Math.max(10, Math.floor(totalMiliseconds / Math.abs(end - start)));

    const timer = setInterval(() => {
      start += Math.ceil((end - start) / 10);
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  // Format numbers nicely with commas
  return <span>{count.toLocaleString()}</span>;
}

export default function CommunityStatsBar() {
  const { stats, isLoading, error } = useCommunityStats();

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
        Failed to load community statistics.
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="grid animate-pulse grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: 'Eco Members',
      value: stats.totalUsers,
      suffix: '',
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Active This Week',
      value: stats.activeUsers7d,
      suffix: '',
      color: 'from-sky-500/10 to-blue-500/10 text-sky-600 dark:text-sky-400',
    },
    {
      label: 'Total XP Earned',
      value: stats.totalXpEarned,
      suffix: '',
      color: 'from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Assessments Done',
      value: stats.assessmentsCompleted,
      suffix: '',
      color: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Saved Projections',
      value: stats.simulationsSaved,
      suffix: '',
      color: 'from-pink-500/10 to-rose-500/10 text-pink-600 dark:text-pink-400',
    },
    {
      label: 'Badges Earned',
      value: stats.badgesEarned,
      suffix: '',
      color: 'from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {statItems.map((item, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden bg-gradient-to-br ${item.color.split(' ')[0]} ${item.color.split(' ')[1]} rounded-xl border border-zinc-200 p-4 transition-all duration-300 hover:shadow-md dark:border-zinc-800/80`}
        >
          <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {item.label}
          </p>
          <p className="mt-2 text-xl font-bold tracking-tight">
            <AnimatedCounter value={item.value} />
            {item.suffix}
          </p>
        </div>
      ))}
    </div>
  );
}
