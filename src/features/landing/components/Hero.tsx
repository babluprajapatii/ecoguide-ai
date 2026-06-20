'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Mail, ArrowRight, ChevronsDown, CheckCircle } from 'lucide-react';

export function Hero() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleCoachCTA = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (user) {
      // Already authenticated — go directly to AI Coach
      router.push('/coach');
      return;
    }

    // Not authenticated — show brief confirmation then redirect to login
    setSubmitted(true);
    // Persist email hint so login page can pre-fill it
    if (email) {
      try {
        localStorage.setItem('ecoguide_login_email_hint', email);
      } catch {
        // localStorage not available (e.g. private browsing) — silently ignore
      }
    }
    setTimeout(() => {
      router.push('/login?redirectTo=%2Fcoach');
    }, 1200);
  };

  const handleScrollDown = () => {
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
      dashboardSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-gradient grid-bg relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Orbital Decoration (Responsive Scale) */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 opacity-25 md:h-[500px] md:w-[500px]">
        <div className="absolute inset-0 rounded-full border border-eco-500/20" />
        <div className="absolute inset-8 rounded-full border border-eco-500/15" />
        <div className="absolute inset-16 rounded-full border border-eco-500/10" />
        <div
          className="orbit-dot -ml-1.25 absolute left-1/2 top-0 h-2.5 w-2.5 rounded-full bg-eco-400"
          style={{ animationDuration: '12s' }}
        />
        <div
          className="orbit-dot absolute left-1/2 top-0 -ml-1 h-2 w-2 rounded-full bg-eco-300"
          style={{ animationDuration: '18s', animationDirection: 'reverse' }}
        />
      </div>

      {/* Glow Orbs */}
      <div className="pointer-events-none absolute left-20 top-20 h-72 w-72 rounded-full bg-eco-500/10 blur-[100px]" />
      <div className="bg-eco-600/8 pointer-events-none absolute bottom-20 right-20 h-96 w-96 rounded-full blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-eco-500/20 bg-eco-500/5 px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-eco-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-eco-300">
            AI-Powered Sustainability
          </span>
        </div>

        {/* Headline */}
        <h1 className="mb-6 animate-fade-in-up font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-white [animation-delay:0.1s] md:text-6xl lg:text-7xl">
          Optimize Your Home.
          <br />
          <span className="text-gradient">Lower Utility Bills.</span>
          <br />
          Reduce Your Footprint.
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-2xl animate-fade-in-up text-base font-light leading-relaxed text-stone-400 [animation-delay:0.2s] md:text-lg">
          The sustainable living platform that combines AI guidance, carbon footprint tracking, and
          smart home integration to help you live greener — effortlessly.
        </p>

        {/* Email Form */}
        <div className="mx-auto max-w-lg animate-fade-in-up [animation-delay:0.3s]">
          {submitted ? (
            <div className="glass-card flex items-center justify-center gap-3 rounded-full border-eco-400 bg-eco-500/10 px-6 py-4 text-eco-300">
              <CheckCircle className="h-5 w-5 text-eco-400" />
              <span className="text-sm font-semibold">
                Welcome aboard! Loading your AI Sustainability Coach...
              </span>
            </div>
          ) : (
            <form onSubmit={handleCoachCTA} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <label htmlFor="hero-email" className="sr-only">
                  Email Address
                </label>
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
                <input
                  id="hero-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-eco-500/15 bg-dark-700/80 py-3.5 pl-12 pr-4 text-sm text-white placeholder-stone-500 transition-all focus:border-eco-500/40 focus:outline-none focus:ring-2 focus:ring-eco-500/10 focus-visible:ring-2 focus-visible:ring-eco-400"
                />
              </div>
              <button
                type="submit"
                className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
              >
                <span>Meet My AI Coach</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-stone-600">
            Free to start &bull; No credit card required &bull; Cancel anytime
          </p>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={handleScrollDown}
          className="mt-16 animate-bounce rounded-full p-2 text-eco-500/50 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
          aria-label="Scroll down to dashboard"
        >
          <ChevronsDown className="h-6 w-6" />
        </button>
      </div>
    </section>
  );
}
