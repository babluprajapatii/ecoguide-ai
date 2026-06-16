'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';

export function CTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    // Log registration safely
    console.log('Registered email for AI Coach:', email);
  };

  return (
    <section id="cta" className="relative py-20 md:py-32 overflow-hidden bg-dark-900 border-t border-eco-500/10">
      {/* Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-eco-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-eco-500/20 bg-eco-500/5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-eco-400 animate-pulse" />
          <span className="text-xs font-semibold text-eco-300 tracking-wider uppercase">Join the Green Movement</span>
        </div>

        <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white tracking-tight leading-tight mb-6">
          Ready to Lower Your Bills & <br />
          <span className="text-gradient">Reduce Your Footprint?</span>
        </h2>

        <p className="max-w-xl mx-auto text-stone-300 text-base md:text-lg font-light leading-relaxed mb-10">
          Sign up with your email to start your personalized carbon coaching journey. Automate your home savings in less than 5 minutes.
        </p>

        <div className="max-w-lg mx-auto">
          {submitted ? (
            <div
              className="glass-card rounded-full py-4 px-6 flex items-center justify-center gap-3 border-eco-400 bg-eco-500/10 text-eco-300 animate-fade-in-up"
              role="status"
            >
              <CheckCircle className="w-5 h-5 text-eco-400" />
              <span className="text-sm font-semibold">Success! Initializing your AI Coach dashboard...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <label htmlFor="cta-email" className="sr-only">
                  Email Address
                </label>
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input
                  id="cta-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3.5 rounded-full bg-dark-700/80 border border-eco-500/15 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-eco-500/40 focus:ring-2 focus:ring-eco-500/20 focus-visible:ring-2 focus-visible:ring-eco-400 transition-all"
                />
              </div>
              <button
                type="submit"
                className="btn-primary text-sm font-semibold text-white px-8 py-3.5 rounded-full tracking-wide whitespace-nowrap flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
              >
                <span>Meet My AI Coach</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <p className="text-stone-400 text-xs mt-4 font-light">
            Free to start &bull; No credit card required &bull; Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
