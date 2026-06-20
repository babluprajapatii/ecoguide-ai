import type { Metadata } from 'next';
import { Navbar } from '@/features/landing/components/Navbar';
import { Hero } from '@/features/landing/components/Hero';
import { LogoCloud } from '@/features/landing/components/LogoCloud';
import { Metrics } from '@/features/landing/components/Metrics';
import { Features } from '@/features/landing/components/Features';
import { HowItWorks } from '@/features/landing/components/HowItWorks';
import { AICoachPreview } from '@/features/landing/components/AICoachPreview';
import { ImpactSimulator } from '@/features/landing/components/ImpactSimulator';
import { Integrations } from '@/features/landing/components/Integrations';
import { CommunityLeaderboard } from '@/features/landing/components/CommunityLeaderboard';
import { Testimonials } from '@/features/landing/components/Testimonials';
import { FAQ } from '@/features/landing/components/FAQ';
import { CTA } from '@/features/landing/components/CTA';
import { Footer } from '@/features/landing/components/Footer';
import { LeafParticles } from '@/shared/components/landing/LeafParticles';

export const metadata: Metadata = {
  title: 'EcoGuide AI — Optimize Your Home, Lower Utility Bills',
  description:
    'The sustainable living platform combining AI coaching, carbon tracking, and smart integrations.',
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-dark-900 text-stone-200">
      {/* Background elements */}
      <LeafParticles />

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10 w-full">
        {/* Hero Section */}
        <Hero />

        {/* Live Metrics Dashboard */}
        <Metrics />

        {/* Smart Grid Partner badges */}
        <section className="relative z-10 bg-dark-900 pb-16">
          <div className="mx-auto max-w-7xl px-6">
            <LogoCloud />
          </div>
        </section>

        {/* Product Modules & Capabilities */}
        <Features />

        {/* How It Works Timeline */}
        <HowItWorks />

        {/* 24/7 AI Coach Chat Interface Preview */}
        <AICoachPreview />

        {/* Dynamic Savings & Carbon Impact Simulator */}
        <ImpactSimulator />

        {/* Integrations & Leaderboard Block */}
        <section
          id="community"
          className="relative overflow-hidden border-t border-eco-500/10 bg-dark-900 py-20 md:py-32"
        >
          <div className="pointer-events-none absolute right-0 top-20 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[120px]" />
          <div className="relative z-10 mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-eco-400">
                Seamless Smart Integrations
              </span>
              <h2 className="mt-3 font-serif text-3xl tracking-tight text-white md:text-5xl">
                Connect Your <span className="text-gradient">Smart Home</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl font-light text-stone-400">
                Works with the devices and platforms you already use.
              </p>
            </div>

            {/* Integrations Grid */}
            <Integrations />

            {/* Neighborhood Leaderboard */}
            <CommunityLeaderboard />
          </div>
        </section>

        {/* Community Testimonials */}
        <Testimonials />

        {/* FAQ Accordions */}
        <FAQ />

        {/* Main Email Call to Action */}
        <CTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
