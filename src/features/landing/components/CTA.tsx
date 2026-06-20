'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';

export function CTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (user) {
      // Already authenticated — go directly to AI Coach
      router.push('/coach');
      return;
    }

    // Not authenticated — show confirmation then redirect to login
    setSubmitted(true);
    if (email) {
      try {
        localStorage.setItem('ecoguide_login_email_hint', email);
      } catch {
        // localStorage unavailable — silently ignore
      }
    }
    setTimeout(() => {
      router.push('/login?redirectTo=%2Fcoach');
    }, 1200);
  };

  return (
    <section
      id="cta"
      className="relative overflow-hidden border-t border-eco-500/10 bg-dark-900 py-20 md:py-32"
    >
      {/* Glow Orbs */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-eco-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-eco-500/20 bg-eco-500/5 px-3 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-eco-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-eco-300">
            Join the Green Movement
          </span>
        </div>

        <h2 className="mb-6 font-serif text-3xl leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
          Ready to Lower Your Bills & <br />
          <span className="text-gradient">Reduce Your Footprint?</span>
        </h2>

        <p className="mx-auto mb-10 max-w-xl text-base font-light leading-relaxed text-stone-300 md:text-lg">
          Sign up with your email to start your personalized carbon coaching journey. Automate your
          home savings in less than 5 minutes.
        </p>

        <div className="mx-auto max-w-lg">
          {submitted ? (
            <div
              className="glass-card flex animate-fade-in-up items-center justify-center gap-3 rounded-full border-eco-400 bg-eco-500/10 px-6 py-4 text-eco-300"
              role="status"
            >
              <CheckCircle className="h-5 w-5 text-eco-400" />
              <span className="text-sm font-semibold">
                Success! Initializing your AI Coach dashboard...
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <label htmlFor="cta-email" className="sr-only">
                  Email Address
                </label>
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <input
                  id="cta-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-eco-500/15 bg-dark-700/80 py-3.5 pl-12 pr-4 text-sm text-white placeholder-stone-500 transition-all focus:border-eco-500/40 focus:outline-none focus:ring-2 focus:ring-eco-500/20 focus-visible:ring-2 focus-visible:ring-eco-400"
                />
              </div>
              <button
                type="submit"
                className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-8 py-3.5 text-sm font-semibold tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
              >
                <span>Meet My AI Coach</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          <p className="mt-4 text-xs font-light text-stone-400">
            Free to start &bull; No credit card required &bull; Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
