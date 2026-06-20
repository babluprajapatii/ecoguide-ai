import { Thermometer, Zap, Sun, Lightbulb, ShieldAlert, Cpu, Link, Globe } from 'lucide-react';

interface IntegrationItem {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  category: string;
  colorClass: string;
  bgClass: string;
}

const integrationsList: IntegrationItem[] = [
  {
    icon: Thermometer,
    name: 'Nest Thermostat',
    category: 'HVAC Automation',
    colorClass: 'text-eco-400',
    bgClass: 'bg-eco-500/10',
  },
  {
    icon: Zap,
    name: 'Tesla Powerwall',
    category: 'Home Battery',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
  },
  {
    icon: Sun,
    name: 'SolarEdge',
    category: 'Solar Inverter',
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/10',
  },
  {
    icon: Cpu,
    name: 'ecobee Smart',
    category: 'Thermostat Control',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
  },
  {
    icon: Lightbulb,
    name: 'Philips Hue',
    category: 'Smart Lighting',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
  },
  {
    icon: ShieldAlert,
    name: 'SmartThings',
    category: 'Appliance Sync',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10',
  },
  {
    icon: Link,
    name: 'Sense Meter',
    category: 'Energy Monitor',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
  },
  {
    icon: Globe,
    name: 'Utility APIs',
    category: 'Smart Grid Sync',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
  },
];

export function Integrations() {
  return (
    <div className="mt-16">
      {/* Grid */}
      <div className="mb-20 grid grid-cols-2 gap-4 md:grid-cols-4">
        {integrationsList.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div
              key={index}
              className="glass-card group flex flex-col items-center justify-center rounded-xl border border-eco-500/10 p-5 text-center transition-all duration-300 hover:border-eco-500/30"
            >
              <div
                className={`h-12 w-12 rounded-xl ${item.bgClass} mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
              >
                <IconComponent className={`h-6 w-6 ${item.colorClass}`} />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-white transition-colors group-hover:text-eco-400">
                {item.name}
              </h3>
              <p className="text-xs font-light text-stone-500">{item.category}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
