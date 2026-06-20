import { Search, Cpu, Rocket } from 'lucide-react';

interface StepItem {
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  borderClass: string;
  badgeClass: string;
  textClass: string;
}

const steps: StepItem[] = [
  {
    number: '01',
    icon: Search,
    title: 'Assess',
    description:
      'Measure your carbon footprint by inputting home energy, transport, and diet data. Get an instant carbon benchmark in under 5 minutes.',
    borderClass: 'border-eco-500/30',
    badgeClass: 'bg-eco-500',
    textClass: 'text-eco-400',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Optimize',
    description:
      'Our eco-model evaluates thousands of combinations to recommend the highest-impact, lowest-cost energy saving actions for your home.',
    borderClass: 'border-amber-500/30',
    badgeClass: 'bg-amber-500',
    textClass: 'text-amber-400',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Improve',
    description:
      'Unlock green achievements, track your progress, and compete in community leagues. Watch your carbon shrink and savings grow month over month.',
    borderClass: 'border-purple-500/30',
    badgeClass: 'bg-purple-500',
    textClass: 'text-purple-400',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 py-20 md:py-32"
    >
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="mb-20 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-eco-400">
            How EcoGuide AI Works
          </span>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-white md:text-5xl">
            Three Simple Phases to <span className="text-gradient">Net Zero</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-light text-stone-400">
            From assessment to real-time optimization — your journey to sustainable living starts
            here.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="relative">
          {/* Horizontal Connection Line (visible on desktop md+) */}
          <div className="absolute left-12 right-12 top-10 z-0 hidden h-px bg-gradient-to-r from-transparent via-eco-500/30 to-transparent md:block" />

          <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="group text-center">
                  {/* Circle Number Container */}
                  <div
                    className={`relative inline-flex h-20 w-20 items-center justify-center rounded-full border-2 bg-dark-700 ${step.borderClass} mb-6 transition-transform duration-300 group-hover:scale-105`}
                  >
                    <span className={`font-serif text-2xl font-semibold ${step.textClass}`}>
                      {step.number}
                    </span>
                    <div
                      className={`absolute -right-1 -top-1 h-6 w-6 rounded-full ${step.badgeClass} flex items-center justify-center`}
                    >
                      <IconComponent className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  {/* Step Info */}
                  <h3 className="mb-3 font-serif text-xl font-semibold text-white">{step.title}</h3>
                  <p className="px-4 text-sm font-light leading-relaxed text-stone-400 md:px-2">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
