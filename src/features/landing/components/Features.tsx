import { Bot, ClipboardCheck, Trophy, PlugZap, ArrowRight } from 'lucide-react';

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  colorClass: string;
  iconBgClass: string;
}

const featuresList: FeatureItem[] = [
  {
    icon: Bot,
    title: 'Real-Time AI Coach',
    description:
      '24/7 personalized sustainability guidance powered by GPT. Get instant recommendations on energy usage, waste reduction, and green alternatives tailored to your lifestyle.',
    colorClass: 'text-eco-400',
    iconBgClass: 'from-eco-500/20 to-eco-600/10',
  },
  {
    icon: ClipboardCheck,
    title: 'Smart Assessments',
    description:
      'Comprehensive home energy audits using AI vision and utility data. Identify inefficiencies and get prioritized action plans with ROI projections.',
    colorClass: 'text-amber-400',
    iconBgClass: 'from-amber-500/20 to-amber-600/10',
  },
  {
    icon: Trophy,
    title: 'Eco Leaderboards',
    description:
      'Compete in sustainability leagues with neighbors and friends. Earn badges, unlock achievements, and climb community rankings through real impact.',
    colorClass: 'text-purple-400',
    iconBgClass: 'from-purple-500/20 to-purple-600/10',
  },
  {
    icon: PlugZap,
    title: 'Energy Integrations',
    description:
      'Connect with Nest, Tesla Powerwall, smart plugs, and utility APIs. Automatic data sync means zero manual entry and real-time optimization.',
    colorClass: 'text-cyan-400',
    iconBgClass: 'from-cyan-500/20 to-cyan-600/10',
  },
];

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden bg-dark-900 py-20 md:py-32">
      {/* Glow Orb */}
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-eco-500/5 blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-eco-400">
            Platform Capabilities
          </span>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-white md:text-5xl">
            Modules That Power Your <span className="text-gradient">Net-Zero Life</span>
          </h2>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {featuresList.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="glass-card group flex items-start gap-5 rounded-2xl p-8 outline-none focus-within:ring-2 focus-within:ring-eco-500/30"
              >
                <div
                  className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.iconBgClass} flex shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                >
                  <IconComponent className={`h-7 w-7 ${item.colorClass}`} />
                </div>
                <div>
                  <h3 className="mb-2 font-serif text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm font-light leading-relaxed text-stone-400">
                    {item.description}
                  </p>
                  <a
                    href="#cta"
                    className={`inline-flex items-center gap-1 ${item.colorClass} mt-4 rounded px-1 text-xs font-medium transition-all hover:gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2`}
                  >
                    <span>Learn more</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
