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
    description: 'Measure your carbon footprint by inputting home energy, transport, and diet data. Get an instant carbon benchmark in under 5 minutes.',
    borderClass: 'border-eco-500/30',
    badgeClass: 'bg-eco-500',
    textClass: 'text-eco-400',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Optimize',
    description: 'Our eco-model evaluates thousands of combinations to recommend the highest-impact, lowest-cost energy saving actions for your home.',
    borderClass: 'border-amber-500/30',
    badgeClass: 'bg-amber-500',
    textClass: 'text-amber-400',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Improve',
    description: 'Unlock green achievements, track your progress, and compete in community leagues. Watch your carbon shrink and savings grow month over month.',
    borderClass: 'border-purple-500/30',
    badgeClass: 'bg-purple-500',
    textClass: 'text-purple-400',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-20">
          <span className="text-xs font-semibold text-eco-400 tracking-[0.2em] uppercase">
            How EcoGuide AI Works
          </span>
          <h2 className="font-serif text-3xl md:text-5xl tracking-tight mt-3 text-white">
            Three Simple Phases to <span className="text-gradient">Net Zero</span>
          </h2>
          <p className="text-stone-400 mt-4 max-w-xl mx-auto font-light">
            From assessment to real-time optimization — your journey to sustainable living starts here.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="relative">
          {/* Horizontal Connection Line (visible on desktop md+) */}
          <div className="hidden md:block absolute top-10 left-12 right-12 h-px bg-gradient-to-r from-transparent via-eco-500/30 to-transparent z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="text-center group">
                  {/* Circle Number Container */}
                  <div
                    className={`relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-700 border-2 ${step.borderClass} mb-6 transition-transform duration-300 group-hover:scale-105`}
                  >
                    <span className={`text-2xl font-serif font-semibold ${step.textClass}`}>
                      {step.number}
                    </span>
                    <div
                      className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${step.badgeClass} flex items-center justify-center`}
                    >
                      <IconComponent className="text-white w-3 h-3" />
                    </div>
                  </div>
                  {/* Step Info */}
                  <h3 className="text-xl font-serif font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-stone-400 font-light text-sm leading-relaxed px-4 md:px-2">
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
