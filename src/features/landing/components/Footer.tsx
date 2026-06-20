import { Leaf } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-eco-500/10 bg-dark-900 py-16">
      {/* Background glow orb */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-eco-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Logo & Description */}
          <div className="flex flex-col gap-4">
            <a href="/" className="group flex w-fit items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-eco-400 to-eco-600 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span className="font-serif text-lg font-semibold tracking-tight text-white">
                EcoGuide<span className="text-eco-400">AI</span>
              </span>
            </a>
            <p className="max-w-xs text-sm font-light leading-relaxed text-stone-400">
              Combining AI guidance, real-time tracking, and smart integrations to make zero-carbon
              living accessible and affordable for everyone.
            </p>
            <div className="mt-2 flex gap-4">
              <a
                href="/"
                className="rounded p-1 text-stone-500 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                aria-label="EcoGuide AI on Twitter"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a
                href="/"
                className="rounded p-1 text-stone-500 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                aria-label="EcoGuide AI on GitHub"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a
                href="/"
                className="rounded p-1 text-stone-500 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                aria-label="EcoGuide AI on LinkedIn"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">
              Platform
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href="#dashboard"
                  className="rounded text-sm font-light text-stone-400 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                >
                  Live Impact Dashboard
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="rounded text-sm font-light text-stone-400 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                >
                  Modules & Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="rounded text-sm font-light text-stone-400 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#analytics"
                  className="rounded text-sm font-light text-stone-400 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                >
                  Savings Simulator
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">
              Resources
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href="#ai-coach"
                  className="rounded text-sm font-light text-stone-400 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                >
                  AI Coach Preview
                </a>
              </li>
              <li>
                <a
                  href="/"
                  className="rounded text-sm font-light text-stone-400 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                >
                  Home Energy Audits
                </a>
              </li>
              <li>
                <a
                  href="/"
                  className="rounded text-sm font-light text-stone-400 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/"
                  className="rounded text-sm font-light text-stone-400 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Partner Certification */}
          <div>
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">
              Security & Grid
            </h3>
            <p className="mb-4 text-sm font-light leading-relaxed text-stone-400">
              Fully compliant with utility security guidelines and smart grid data policies.
            </p>
            <div className="inline-flex items-center gap-2 rounded border border-eco-500/20 bg-eco-500/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-eco-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-eco-400" />
              Grid Integrated
            </div>
          </div>
        </div>

        {/* Bottom copyright block */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-eco-500/5 pt-8 md:flex-row">
          <p className="text-xs font-light text-stone-500">
            &copy; {new Date().getFullYear()} EcoGuide AI Inc. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs font-light text-stone-500">
            Designed for Net-Zero emissions impact{' '}
            <span className="font-bold text-eco-400">&bull;</span> Platform version 1.4.0
          </p>
        </div>
      </div>
    </footer>
  );
}
