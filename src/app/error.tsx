'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Something went wrong
        </h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 max-w-lg overflow-auto rounded-md bg-muted p-4 text-left text-sm text-muted-foreground">
            {error.message}
          </pre>
        )}
        <div className="mt-10">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            type="button"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
