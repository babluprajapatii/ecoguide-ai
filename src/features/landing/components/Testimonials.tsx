import { Star, Quote } from 'lucide-react';

interface TestimonialItem {
  quote: string;
  name: string;
  location: string;
  savings: string;
}

const testimonialsList: TestimonialItem[] = [
  {
    quote:
      'The AI Coach alerts me during peak hours. I pre-cool my house and shift usage. Saved $54 in my first month, and reduced carbon by 180 lbs!',
    name: 'Jessica Miller',
    location: 'Austin, TX',
    savings: 'Saved $54/mo',
  },
  {
    quote:
      "Integrating with my Nest Thermostat was incredibly easy. I love competing on the leaderboard with my neighbors. We're on track to reduce 2.1 tons of CO2 this year!",
    name: 'Marcus Chen',
    location: 'Seattle, WA',
    savings: 'Saved $340/yr',
  },
  {
    quote:
      "EcoGuide AI transformed how we manage home energy. It's like having a dedicated home auditor in our pocket 24/7. Simple, actionable advice that actually works.",
    name: 'David and Sarah K.',
    location: 'Denver, CO',
    savings: 'Saved $410/yr',
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative overflow-hidden border-t border-eco-500/10 bg-dark-900 py-20 md:py-32"
    >
      <div className="pointer-events-none absolute left-0 top-1/2 h-96 w-96 rounded-full bg-eco-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-eco-400">
            Testimonials
          </span>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-white md:text-5xl">
            What Our Community <span className="text-gradient">Says</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-light text-stone-400">
            Real-world stories from homeowners reducing carbon emissions and saving on utility
            bills.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonialsList.map((item, index) => (
            <div
              key={index}
              className="glass-card group relative flex flex-col justify-between rounded-2xl border border-eco-500/10 p-8 transition-all duration-300 hover:border-eco-500/30"
            >
              {/* Quote Mark Icon */}
              <Quote className="pointer-events-none absolute right-6 top-6 h-8 w-8 text-eco-500/10 transition-colors group-hover:text-eco-500/20" />

              <div>
                {/* Rating stars */}
                <div className="mb-6 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="mb-6 text-sm font-light italic leading-relaxed text-stone-300">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-eco-500/5 pt-6">
                <div>
                  <h4 className="font-serif text-sm font-semibold text-white">{item.name}</h4>
                  <p className="text-xs font-light text-stone-500">{item.location}</p>
                </div>
                <span className="whitespace-nowrap rounded-full bg-eco-500/10 px-2.5 py-1 text-xs font-semibold text-eco-400">
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
