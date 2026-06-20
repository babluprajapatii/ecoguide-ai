'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { A11yProvider } from '@/providers/a11y-announcer-provider';

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
          <AuthProvider>
            <A11yProvider>{children}</A11yProvider>
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
