import { Star, Quote } from 'lucide-react';

interface TestimonialItem {
  quote: string;
  name: string;
  location: string;
  savings: string;
}

const testimonialsList: TestimonialItem[] = [
  {
    quote: "The AI Coach alerts me during peak hours. I pre-cool my house and shift usage. Saved $54 in my first month, and reduced carbon by 180 lbs!",
    name: 'Jessica Miller',
    location: 'Austin, TX',
    savings: 'Saved $54/mo',
  },
  {
    quote: "Integrating with my Nest Thermostat was incredibly easy. I love competing on the leaderboard with my neighbors. We're on track to reduce 2.1 tons of CO2 this year!",
    name: 'Marcus Chen',
    location: 'Seattle, WA',
    savings: 'Saved $340/yr',
  },
  {
    quote: "EcoGuide AI transformed how we manage home energy. It's like having a dedicated home auditor in our pocket 24/7. Simple, actionable advice that actually works.",
    name: 'David and Sarah K.',
    location: 'Denver, CO',
    savings: 'Saved $410/yr',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-20 md:py-32 overflow-hidden bg-dark-900 border-t border-eco-500/10">
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-eco-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-eco-400 tracking-[0.2em] uppercase">
            Testimonials
          </span>
          <h2 className="font-serif text-3xl md:text-5xl tracking-tight mt-3 text-white">
            What Our Community <span className="text-gradient">Says</span>
          </h2>
          <p className="text-stone-400 mt-4 max-w-xl mx-auto font-light">
            Real-world stories from homeowners reducing carbon emissions and saving on utility bills.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonialsList.map((item, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-8 relative flex flex-col justify-between border border-eco-500/10 hover:border-eco-500/30 transition-all duration-300 group"
            >
              {/* Quote Mark Icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-eco-500/10 group-hover:text-eco-500/20 transition-colors pointer-events-none" />

              <div>
                {/* Rating stars */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-stone-300 font-light text-sm leading-relaxed mb-6 italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="border-t border-eco-500/5 pt-6 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-serif text-sm font-semibold text-white">
                    {item.name}
                  </h4>
                  <p className="text-stone-500 text-xs font-light">{item.location}</p>
                </div>
                <span className="text-xs font-semibold text-eco-400 bg-eco-500/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {item.savings}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
