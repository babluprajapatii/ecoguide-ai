'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders mounts all root-level React providers including error boundary,
 * next-themes ThemeProvider, React Query provider, and Supabase AuthProvider.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
