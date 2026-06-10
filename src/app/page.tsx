import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Welcome to EcoGuide AI - Your AI-powered sustainable living assistant.',
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          EcoGuide AI
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Your AI-powered sustainable living assistant. Make informed choices for a greener
          tomorrow.
        </p>
      </div>
    </main>
  );
}
