'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ComponentType } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Higher-Order Component that protects a page behind authentication.
 *
 * Redirects unauthenticated users to `/login` while the auth session
 * is being checked or if no user is found. Renders a loading spinner
 * during the check.
 *
 * @typeParam P - Props type of the wrapped component.
 * @param WrappedComponent - The component to protect.
 * @returns A new component that renders `WrappedComponent` only when
 *   the user is authenticated.
 *
 * @example
 * ```tsx
 * function DashboardPage() { ... }
 * export default withAuth(DashboardPage);
 * ```
 */
export function withAuth<P extends Record<string, unknown>>(
  WrappedComponent: ComponentType<P>,
): ComponentType<P> {
  function AuthGuard(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.replace('/login');
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center" role="status">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <span className="sr-only">Authenticating...</span>
          </div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  }

  AuthGuard.displayName = `withAuth(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`;

  return AuthGuard;
}
