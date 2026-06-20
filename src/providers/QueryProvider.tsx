'use client';

/**
 * React Query provider for client components.
 *
 * Creates a new `QueryClient` per component lifecycle to avoid
 * sharing cached data between server-rendered requests.
 *
 * @module QueryProvider
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Wraps children with a `QueryClientProvider` using a stable client
 * instance created once per component mount.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
