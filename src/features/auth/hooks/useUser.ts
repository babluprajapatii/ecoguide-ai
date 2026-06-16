'use client';

import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';

/**
 * Returns ONLY the authenticated user object from the authentication context.
 *
 * This hook isolates component rendering, ensuring components that only
 * require basic user metadata (like Sidebar, Navbar, and Avatar indicators)
 * do not re-render when other properties of the session tokens refresh.
 */
export function useUser() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      'useUser must be used within an AuthProvider. ' +
        'Wrap your component tree with <AuthProvider>.'
    );
  }
  return context.user;
}
