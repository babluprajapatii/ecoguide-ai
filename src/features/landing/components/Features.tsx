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
    description: '24/7 personalized sustainability guidance powered by GPT. Get instant recommendations on energy usage, waste reduction, and green alternatives tailored to your lifestyle.',
    colorClass: 'text-eco-400',
    iconBgClass: 'from-eco-500/20 to-eco-600/10',
  },
  {
    icon: ClipboardCheck,
    title: 'Smart Assessments',
    description: 'Comprehensive home energy audits using AI vision and utility data. Identify inefficiencies and get prioritized action plans with ROI projections.',
    colorClass: 'text-amber-400',
    iconBgClass: 'from-amber-500/20 to-amber-600/10',
  },
  {
    icon: Trophy,
    title: 'Eco Leaderboards',
    description: 'Compete in sustainability leagues with neighbors and friends. Earn badges, unlock achievements, and climb community rankings through real impact.',
    colorClass: 'text-purple-400',
    iconBgClass: 'from-purple-500/20 to-purple-600/10',
  },
  {
    icon: PlugZap,
    title: 'Energy Integrations',
    description: 'Connect with Nest, Tesla Powerwall, smart plugs, and utility APIs. Automatic data sync means zero manual entry and real-time optimization.',
    colorClass: 'text-cyan-400',
    iconBgClass: 'from-cyan-500/20 to-cyan-600/10',
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-20 md:py-32 overflow-hidden bg-dark-900">
      {/* Glow Orb */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-eco-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-eco-400 tracking-[0.2em] uppercase">
            Platform Capabilities
          </span>
          <h2 className="font-serif text-3xl md:text-5xl tracking-tight mt-3 text-white">
            Modules That Power Your <span className="text-gradient">Net-Zero Life</span>
          </h2>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuresList.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="glass-card rounded-2xl p-8 group flex items-start gap-5 focus-within:ring-2 focus-within:ring-eco-500/30 outline-none"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.iconBgClass} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}
                >
                  <IconComponent className={`w-7 h-7 ${item.colorClass}`} />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-stone-400 font-light text-sm leading-relaxed">
                    {item.description}
                  </p>
                  <a
                    href="#cta"
                    className={`inline-flex items-center gap-1 ${item.colorClass} text-xs font-medium mt-4 hover:gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 rounded px-1 transition-all`}
                  >
                    <span>Learn more</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
