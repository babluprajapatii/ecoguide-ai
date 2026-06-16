import { Thermometer, Zap, Sun, Lightbulb, ShieldAlert, Cpu, Link, Globe } from 'lucide-react';

interface IntegrationItem {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  category: string;
  colorClass: string;
  bgClass: string;
}

const integrationsList: IntegrationItem[] = [
  { icon: Thermometer, name: 'Nest Thermostat', category: 'HVAC Automation', colorClass: 'text-eco-400', bgClass: 'bg-eco-500/10' },
  { icon: Zap, name: 'Tesla Powerwall', category: 'Home Battery', colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10' },
  { icon: Sun, name: 'SolarEdge', category: 'Solar Inverter', colorClass: 'text-yellow-400', bgClass: 'bg-yellow-500/10' },
  { icon: Cpu, name: 'ecobee Smart', category: 'Thermostat Control', colorClass: 'text-cyan-400', bgClass: 'bg-cyan-500/10' },
  { icon: Lightbulb, name: 'Philips Hue', category: 'Smart Lighting', colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10' },
  { icon: ShieldAlert, name: 'SmartThings', category: 'Appliance Sync', colorClass: 'text-rose-400', bgClass: 'bg-rose-500/10' },
  { icon: Link, name: 'Sense Meter', category: 'Energy Monitor', colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10' },
  { icon: Globe, name: 'Utility APIs', category: 'Smart Grid Sync', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10' },
];

export function Integrations() {
  return (
    <div className="mt-16">
      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
        {integrationsList.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div
              key={index}
              className="glass-card rounded-xl p-5 text-center group flex flex-col items-center justify-center border border-eco-500/10 hover:border-eco-500/30 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl ${item.bgClass} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
              >
                <IconComponent className={`w-6 h-6 ${item.colorClass}`} />
              </div>
              <h3 className="text-white text-sm font-semibold mb-1 group-hover:text-eco-400 transition-colors">
                {item.name}
              </h3>
              <p className="text-stone-500 text-xs font-light">{item.category}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
