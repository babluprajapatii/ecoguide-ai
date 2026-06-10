'use client';

import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
