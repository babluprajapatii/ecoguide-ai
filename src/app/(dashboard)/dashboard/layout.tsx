import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'View your carbon footprint breakdown, track progress, and get personalised sustainability insights.',
};

/**
 * Dashboard layout — wraps all /dashboard/* pages with
 * consistent padding and a max-width container.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your carbon footprint at a glance</p>
      </header>
      {children}
    </main>
  );
}
