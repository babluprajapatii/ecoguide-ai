/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../page';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Mock hook dependencies
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('RegisterPage validations and flows', () => {
  const mockPush = vi.fn();
  const mockSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);

    vi.mocked(useAuth).mockReturnValue({
      signUp: mockSignUp,
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updatePassword: vi.fn(),
    });
  });

  it('renders all required form fields', () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText('Full Name')).toBeDefined();
    expect(screen.getByLabelText('Email Address')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByLabelText('Confirm Password')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeDefined();
  });

  it('validates name, email, and password complexity rules', async () => {
    render(<RegisterPage />);

    const submitBtn = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(submitBtn);

    // Errors should appear on empty submit
    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeDefined();
      expect(screen.getByText('Email is required')).toBeDefined();
      expect(screen.getByText('Password is required')).toBeDefined();
    });
  });

  it('validates password minimum length and complexity', async () => {
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitBtn = screen.getByRole('button', { name: 'Sign Up' });

    // Fill with too short password
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeDefined();
    });

    // Fill with 8 chars but missing numbers or uppercase
    fireEvent.change(passwordInput, { target: { value: 'lowercaseonly' } });
    fireEvent.change(confirmInput, { target: { value: 'lowercaseonly' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Password must contain at least 1 uppercase letter')).toBeDefined();
    });
  });

  it('validates password matching', async () => {
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitBtn = screen.getByRole('button', { name: 'Sign Up' });

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword1' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPass2' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeDefined();
    });
  });

  it('successfully registers and redirects to /verify-email', async () => {
    mockSignUp.mockResolvedValue(undefined);
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitBtn = screen.getByRole('button', { name: 'Sign Up' });

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword1' } });
    fireEvent.change(confirmInput, { target: { value: 'SecurePassword1' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'jane@example.com',
        password: 'SecurePassword1',
        displayName: 'Jane Doe',
      });
      expect(mockPush).toHaveBeenCalledWith('/verify-email');
    });
  });
});
