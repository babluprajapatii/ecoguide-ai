'use client';

import { Calendar, Award, Zap, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionPlansProps {
  readonly onSelectPrompt: (prompt: string) => void;
  readonly isStreaming: boolean;
}

export function ActionPlans({ onSelectPrompt, isStreaming }: ActionPlansProps) {
  const plans = [
    {
      title: '7-Day Kickstart Plan',
      description: 'Focus on immediate, zero-cost actions to eliminate energy waste and optimize daily habits.',
      savings: 'Up to 50 kg CO₂',
      reduction: '~5% weekly reduction',
      icon: Calendar,
      iconColor: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20',
      prompt: 'Please generate a 7-Day sustainability action plan based on my carbon assessment results. For each day, provide a concrete action step, estimated carbon savings, and the expected percentage footprint reduction. Format it nicely without headers.',
    },
    {
      title: '30-Day Habit Shift Plan',
      description: 'Embed sustainable routines into shopping, dieting, and commuting routines for lasting progress.',
      savings: 'Up to 250 kg CO₂',
      reduction: '~12% monthly reduction',
      icon: Zap,
      iconColor: 'text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20',
      prompt: 'Please generate a 30-Day sustainability action plan based on my carbon footprint. Divide it into weekly focus categories (Transport, Diet, Energy, Shopping). Detail weekly actions, savings, and percentage reductions. Format it nicely without headers.',
    },
    {
      title: '90-Day Transition Plan',
      description: 'Major structural shifts including renewable utility transition, travel optimization, and carbon offsets.',
      savings: 'Up to 900 kg CO₂',
      reduction: '~25% quarterly reduction',
      icon: Award,
      iconColor: 'text-purple-500 bg-purple-500/10 dark:bg-purple-500/20',
      prompt: 'Please generate a 90-Day sustainability plan outlining major transition milestones. Include structural alterations (energy utilities, EV transition, rail alternatives, composting setups) with expected annual footprint reduction. Format it nicely without headers.',
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

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-4">
      <div className="border-b border-border/60 pb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-500" />
          <span>AI Action Plans</span>
        </h3>
        <p className="text-[10px] text-muted-foreground">
          Select a roadmap below. EcoGuide AI will generate a personalized task schedule.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 grid-cols-1 md:grid-cols-3"
      >
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <motion.div
              key={plan.title}
              variants={itemVariants}
              className="flex flex-col justify-between rounded-xl border border-border/40 bg-card/50 p-4 transition-all hover:border-emerald-500/20 hover:bg-muted/5 group"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${plan.iconColor}`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-xs font-bold text-foreground">{plan.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/20 flex flex-col gap-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground font-semibold">Est. Savings:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{plan.savings}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground font-semibold">Impact:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-extrabold">{plan.reduction}</span>
                </div>

                <button
                  type="button"
                  disabled={isStreaming}
                  onClick={() => onSelectPrompt(plan.prompt)}
                  className="mt-1 flex items-center justify-between text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none rounded-lg px-2.5 py-1.5 transition-all w-full"
                >
                  <span>Request Plan</span>
                  <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
