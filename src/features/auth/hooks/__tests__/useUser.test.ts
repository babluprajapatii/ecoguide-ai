/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-imports */
import { describe, it, expect, vi } from 'vitest';
import { useContext } from 'react';
import { useUser } from '../useUser';

// Mock react's useContext
vi.mock('react', async () => {
  const original = await vi.importActual<typeof import('react')>('react');
  return {
    ...original,
    useContext: vi.fn(),
  };
});

describe('useUser selector hook', () => {
  it('returns only the user object when context is active', () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };
    const mockContext = {
      user: mockUser,
      session: { access_token: '123' },
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updatePassword: vi.fn(),
    };

    vi.mocked(useContext).mockReturnValue(mockContext as any);

    const result = useUser();
    expect(result).toBe(mockUser);
    expect(result).toEqual({ id: 'test-user-id', email: 'test@example.com' });
  });

  it('throws an error if used outside an AuthProvider', () => {
    vi.mocked(useContext).mockReturnValue(undefined as any);

    expect(() => useUser()).toThrow(
      'useUser must be used within an AuthProvider. Wrap your component tree with <AuthProvider>.'
    );
  });
});
