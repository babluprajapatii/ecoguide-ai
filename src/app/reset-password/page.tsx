'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

/**
 * ResetPasswordPage allows recovery session users to set new passwords.
 *
 * Implements:
 * 1. Active session guards (redirects unauthenticated users to login).
 * 2. Recovery token invalidation (forces logout on successful update).
 * 3. Screen reader errors and password complexity validation.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { user, updatePassword, signOut, loading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active session guard: redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?error=Session expired or invalid reset link');
    }
  }, [user, authLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordSchema) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Update password
      await updatePassword(data.password);

      // 2. Invalidate session to prevent token reuse
      await signOut();

      // 3. Redirect back to login with success flag
      router.push('/login?passwordUpdated=true');
    } catch (err) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Failed to reset password. Please try again.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="grid-bg flex min-h-screen items-center justify-center bg-dark-900">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </main>
    );
  }

  if (!user) {
    return null; // Let useEffect redirect
  }

  return (
    <main className="grid-bg hero-gradient flex min-h-screen items-center justify-center bg-dark-900 px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-eco-500/10 bg-dark-800/85 p-8 shadow-2xl backdrop-blur-md">
        {/* Top Glow Decorator */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="space-y-2 text-center">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-500/20">
              E
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Enter new password</h1>
            <p className="text-sm text-stone-400">
              Please enter and confirm your secure new password
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400"
              role="alert"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-semibold text-stone-400">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                  className="w-full rounded-xl border border-eco-500/10 bg-dark-900 py-2.5 pl-4 pr-10 text-sm text-stone-200 transition-colors focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-500 outline-none hover:text-stone-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-stone-400">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                {...register('confirmPassword')}
                className="w-full rounded-xl border border-eco-500/10 bg-dark-900 px-4 py-2.5 text-sm text-stone-200 transition-colors focus:border-emerald-500 focus:outline-none"
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-xs text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Saving new password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>

          <p className="pt-2 text-center text-xs text-stone-400">
            Remembered your password?{' '}
            <Link
              href="/login"
              className="font-semibold text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
            >
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
