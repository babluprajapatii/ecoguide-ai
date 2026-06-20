'use client';

import { useCoachDashboard } from '../hooks/useCoachDashboard';
import {
  Flame,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Trash2,
  Award,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useState } from 'react';

export function CoachStats() {
  const {
    stats,
    recommendations,
    updateStatus,
    deleteRecommendation,
    createRecommendation,
    isLoadingStats,
    isLoadingRecs,
  } = useCoachDashboard();

  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newSavings, setNewSavings] = useState(100);

  const pendingRecs = recommendations.filter((r) => r.status === 'pending');
  const completedRecs = recommendations.filter((r) => r.status === 'completed');

  const visibleRecs = showCompleted ? completedRecs : pendingRecs;

  const handleAddRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    await createRecommendation({
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      estimated_savings: Number(newSavings),
    });

    setNewTitle('');
    setNewDesc('');
    setNewPriority('medium');
    setNewSavings(100);
    setShowAddForm(false);
  };

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  if (isLoadingStats || isLoadingRecs) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md"
            />
          ))}
        </div>
        <div className="h-64 rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Sustainability Streak',
      value: `${stats?.streak || 0} days`,
      description: 'Consecutive assessment completions',
      icon: Flame,
      iconColor: 'text-orange-500 bg-orange-500/10 dark:bg-orange-500/20',
    },
    {
      title: 'AI Chats Logged',
      value: stats?.conversationCount || 0,
      description: 'Conversations with EcoGuide AI',
      icon: MessageSquare,
      iconColor: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/20',
    },
    {
      title: 'Insights Checklist',
      value: `${completedRecs.length} / ${stats?.insightsCount || 0}`,
      description: 'Completed recommended actions',
      icon: Lightbulb,
      iconColor: 'text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 3 Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              variants={itemVariants}
              className="group relative rounded-2xl border border-border/80 bg-card/40 p-4 shadow-sm backdrop-blur-md transition-all hover:border-emerald-500/20 dark:bg-card/25"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-tight text-muted-foreground">
                  {card.title}
                </span>
                <div
                  className={`rounded-lg p-2 ${card.iconColor} transition-transform group-hover:scale-105`}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xl font-extrabold tracking-tight text-foreground">
                  {card.value}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{card.description}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recommendations Checklist Container */}
      <div className="space-y-4 rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25">
        <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Award size={16} className="text-emerald-500" />
              <span>Recommended Eco Actions</span>
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Actionable tasks suggested by your coach to target high emissions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setShowCompleted(!showCompleted)}
              className="rounded-lg border border-border/80 px-2.5 py-1 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
            >
              {showCompleted ? 'Show Pending' : 'Show Completed'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-emerald-500"
            >
              {showAddForm ? 'Cancel' : 'Add Custom'}
            </button>
          </div>
        </div>

        {/* Add Custom Recommendation Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddRecommendation}
              className="space-y-3 overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="rec-title"
                    className="text-[11px] font-bold uppercase text-muted-foreground"
                  >
                    Action Title
                  </label>
                  <input
                    id="rec-title"
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Switch to eco showerhead"
                    className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="rec-savings"
                    className="text-[11px] font-bold uppercase text-muted-foreground"
                  >
                    Annual CO₂ Savings (kg)
                  </label>
                  <input
                    id="rec-savings"
                    type="number"
                    required
                    min={1}
                    value={newSavings}
                    onChange={(e) => setNewSavings(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="rec-desc"
                  className="text-[11px] font-bold uppercase text-muted-foreground"
                >
                  Description
                </label>
                <textarea
                  id="rec-desc"
                  required
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Summarize the action step and frequency details..."
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase transition-all ${
                        newPriority === p
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-border/80 bg-transparent text-muted-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow transition-colors hover:bg-emerald-500"
                >
                  Save Action
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Action List */}
        <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
          {visibleRecs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 py-8 text-center text-xs font-medium text-muted-foreground">
              {showCompleted
                ? 'No completed recommended actions yet.'
                : 'No pending recommended actions.'}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-2.5"
            >
              {visibleRecs.map((rec) => (
                <motion.div
                  key={rec.id}
                  variants={itemVariants}
                  className="recommendation-card flex items-start gap-3 rounded-xl border border-border/40 bg-card/50 p-3.5 transition-all hover:border-emerald-500/15"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                          rec.priority === 'high'
                            ? 'bg-red-500/10 text-red-500'
                            : rec.priority === 'medium'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                        }`}
                      >
                        {rec.priority} priority
                      </span>
                      <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        <Zap size={8} />
                        {rec.estimated_savings} kg/yr
                      </span>
                    </div>

                    <h4
                      className={`text-xs font-bold text-foreground ${rec.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}
                    >
                      {rec.title}
                    </h4>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {rec.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {rec.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          aria-label="Mark action as completed"
                          onClick={() => void updateStatus(rec.id, 'completed')}
                          className="rounded-lg p-1 text-muted-foreground transition-all hover:bg-emerald-500/5 hover:text-emerald-500"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Dismiss recommended action"
                          onClick={() => void updateStatus(rec.id, 'dismissed')}
                          className="rounded-lg p-1 text-muted-foreground transition-all hover:bg-red-500/5 hover:text-red-500"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      aria-label="Delete recommended action"
                      onClick={() => void deleteRecommendation(rec.id)}
                      className="rounded-lg p-1 text-muted-foreground transition-all hover:bg-destructive/5 hover:text-destructive"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
