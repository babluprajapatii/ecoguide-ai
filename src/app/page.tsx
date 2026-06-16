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
    <div className="relative min-h-screen bg-dark-900 text-stone-200 overflow-x-hidden">
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
        <section className="bg-dark-900 pb-16 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
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
        <section id="community" className="relative py-20 md:py-32 overflow-hidden bg-dark-900 border-t border-eco-500/10">
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-xs font-semibold text-eco-400 tracking-[0.2em] uppercase">
                Seamless Smart Integrations
              </span>
              <h2 className="font-serif text-3xl md:text-5xl tracking-tight mt-3 text-white">
                Connect Your <span className="text-gradient">Smart Home</span>
              </h2>
              <p className="text-stone-400 mt-4 max-w-xl mx-auto font-light">
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
