'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mail, ArrowRight, ChevronsDown, CheckCircle } from 'lucide-react';

export function Hero() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    console.log('Hero email submitted:', email);
    
    // Scroll to AI Coach preview block on submit
    setTimeout(() => {
      const coachSection = document.getElementById('ai-coach');
      if (coachSection) {
        coachSection.scrollIntoView({ behavior: 'smooth' });
        coachSection.focus({ preventScroll: true });
      }
    }, 1500);
  };

  const handleScrollDown = () => {
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
      dashboardSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center hero-gradient grid-bg overflow-hidden">
      {/* Orbital Decoration (Responsive Scale) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] pointer-events-none opacity-25">
        <div className="absolute inset-0 rounded-full border border-eco-500/20" />
        <div className="absolute inset-8 rounded-full border border-eco-500/15" />
        <div className="absolute inset-16 rounded-full border border-eco-500/10" />
        <div className="orbit-dot absolute w-2.5 h-2.5 rounded-full bg-eco-400 left-1/2 -ml-1.25 top-0" style={{ animationDuration: '12s' }} />
        <div className="orbit-dot absolute w-2 h-2 rounded-full bg-eco-300 left-1/2 -ml-1 top-0" style={{ animationDuration: '18s', animationDirection: 'reverse' }} />
      </div>

      {/* Glow Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-eco-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-eco-600/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24 pb-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-eco-500/20 bg-eco-500/5 mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-eco-400 animate-pulse" />
          <span className="text-xs font-semibold text-eco-300 tracking-wider uppercase">
            AI-Powered Sustainability
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] mb-6 text-white animate-fade-in-up [animation-delay:0.1s]">
          Optimize Your Home.
          <br />
          <span className="text-gradient">Lower Utility Bills.</span>
          <br />
          Reduce Your Footprint.
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-stone-400 text-base md:text-lg font-light leading-relaxed mb-10 animate-fade-in-up [animation-delay:0.2s]">
          The sustainable living platform that combines AI guidance, carbon footprint tracking, and smart home integration to help you live greener — effortlessly.
        </p>

        {/* Email Form */}
        <div className="max-w-lg mx-auto animate-fade-in-up [animation-delay:0.3s]">
          {submitted ? (
            <div className="glass-card rounded-full py-4 px-6 flex items-center justify-center gap-3 border-eco-400 bg-eco-500/10 text-eco-300">
              <CheckCircle className="w-5 h-5 text-eco-400" />
              <span className="text-sm font-semibold">Welcome aboard! Loading your AI Sustainability Coach...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <label htmlFor="hero-email" className="sr-only">
                  Email Address
                </label>
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 w-5 h-5" />
                <input
                  id="hero-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3.5 rounded-full bg-dark-700/80 border border-eco-500/15 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-eco-500/40 focus:ring-2 focus:ring-eco-500/10 transition-all focus-visible:ring-2 focus-visible:ring-eco-400"
                />
              </div>
              <button
                type="submit"
                className="btn-primary text-sm font-semibold text-white px-7 py-3.5 rounded-full tracking-wide whitespace-nowrap flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
              >
                <span>Meet My AI Coach</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
          <p className="text-stone-600 text-xs mt-3">
            Free to start &bull; No credit card required &bull; Cancel anytime
          </p>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={handleScrollDown}
          className="mt-16 animate-bounce text-eco-500/50 hover:text-eco-400 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 rounded-full transition-colors"
          aria-label="Scroll down to dashboard"
        >
          <ChevronsDown className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
