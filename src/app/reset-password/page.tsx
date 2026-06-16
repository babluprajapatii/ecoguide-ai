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

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
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
      <main className="min-h-screen flex items-center justify-center bg-dark-900 grid-bg">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </main>
    );
  }

  if (!user) {
    return null; // Let useEffect redirect
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-dark-900 grid-bg hero-gradient px-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-eco-500/10 bg-dark-800/85 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Top Glow Decorator */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20 text-white font-bold text-lg mb-2">
              E
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Enter new password</h1>
            <p className="text-stone-400 text-sm">
              Please enter and confirm your secure new password
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl" role="alert">
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
                  className="w-full pl-4 pr-10 py-2.5 bg-dark-900 border border-eco-500/10 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300 outline-none"
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
                className="w-full px-4 py-2.5 bg-dark-900 border border-eco-500/10 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
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
              className="w-full py-2.5 btn-primary rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
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

          <p className="text-stone-400 text-xs text-center pt-2">
            Remembered your password?{' '}
            <Link
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
            >
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
