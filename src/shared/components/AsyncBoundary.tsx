import type { ReactNode } from 'react';

interface AsyncBoundaryProps {
  readonly isLoading: boolean;
  readonly error?: string | Error | null;
  readonly fallback?: ReactNode;
  readonly errorFallback?: ReactNode;
  readonly children: ReactNode;
}

/**
 * AsyncBoundary abstracts and standardizes loading skeletons and error displays.
 * It ensures consistent layouts and transitions while reducing duplicate state logic.
 */
export function AsyncBoundary({
  isLoading,
  error,
  fallback,
  errorFallback,
  children,
}: AsyncBoundaryProps) {
  if (isLoading) {
    return (
      fallback || (
        <div
          data-testid="async-boundary-loading"
          className="h-[300px] w-full animate-pulse rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25"
        />
      )
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    return (
      errorFallback || (
        <div
          data-testid="async-boundary-error"
          className="flex h-[300px] w-full items-center justify-center rounded-2xl border border-border/80 bg-card/40 p-6 text-xs text-muted-foreground shadow-sm backdrop-blur-md dark:bg-card/25"
        >
          {message || 'An error occurred while loading content.'}
        </div>
      )
    );
  }

  return <>{children}</>;
}
