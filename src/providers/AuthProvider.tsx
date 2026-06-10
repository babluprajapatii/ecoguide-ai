'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

/** Credentials for email/password sign-in. */
export interface SignInCredentials {
  email: string;
  password: string;
}

/** Credentials for creating a new account. */
export interface SignUpCredentials {
  email: string;
  password: string;
  displayName: string;
}

/** Shape of the authentication context value. */
export interface AuthContextValue {
  /** The currently authenticated user, or `null` if unauthenticated. */
  user: User | null;
  /** The current Supabase session, or `null` if no active session. */
  session: Session | null;
  /** Whether the initial session is still being loaded. */
  loading: boolean;
  /** The most recent authentication error, if any. */
  error: AuthError | null;
  /** Sign in with email and password. */
  signIn: (credentials: SignInCredentials) => Promise<void>;
  /** Sign out the current user. */
  signOut: () => Promise<void>;
  /** Create a new account with email, password, and display name. */
  signUp: (credentials: SignUpCredentials) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provides authentication state and methods to the component tree.
 *
 * Wraps children with an `AuthContext.Provider` that exposes the
 * current user, session, loading state, and auth actions (signIn,
 * signOut, signUp). Listens for Supabase auth state changes and
 * updates the context reactively.
 *
 * @param props.children - React nodes to render within the auth context.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Load the initial session
    const initSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (err) {
        console.error('[AuthProvider] Failed to get initial session:', err);
      } finally {
        setLoading(false);
      }
    };

    void initSession();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setError(null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Authenticates a user with email and password.
   * Clears any previous error on success; sets `error` on failure.
   */
  const signIn = useCallback(
    async ({ email, password }: SignInCredentials) => {
      setError(null);
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError);
      }
    },
    [supabase],
  );

  /**
   * Signs out the current user and clears local session state.
   */
  const signOut = useCallback(async () => {
    setError(null);
    const { error: authError } = await supabase.auth.signOut();
    if (authError) {
      setError(authError);
    }
  }, [supabase]);

  /**
   * Creates a new user account with email, password, and a display name
   * stored in `user_metadata`.
   */
  const signUp = useCallback(
    async ({ email, password, displayName }: SignUpCredentials) => {
      setError(null);
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (authError) {
        setError(authError);
      }
    },
    [supabase],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      error,
      signIn,
      signOut,
      signUp,
    }),
    [user, session, loading, error, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
