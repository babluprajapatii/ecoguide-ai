'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/providers/AuthProvider';

/**
 * Returns the current authentication context value.
 *
 * Must be called from within an `<AuthProvider>`. Throws a descriptive
 * error if used outside the provider boundary.
 *
 * @returns The auth context containing user, session, loading state,
 *   error, and auth action methods.
 *
 * @example
 * ```tsx
 * function ProfileButton() {
 *   const { user, signOut, loading } = useAuth();
 *   if (loading) return <Spinner />;
 *   if (!user) return <LoginLink />;
 *   return <button onClick={signOut}>Sign Out</button>;
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
        'Wrap your component tree with <AuthProvider>.',
    );
  }
  return context;
}
