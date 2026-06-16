'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginSchema = z.infer<typeof loginSchema>;

/**
 * LoginPage renders the user sign-in portal.
 *
 * Implements:
 * 1. Zod schema validation using React Hook Form.
 * 2. Unverified email detection with click-to-resend recovery flow.
 * 3. Loading, error, and post-verification success banners.
 * 4. High-contrast input elements with screen-reader descriptions.
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const verified = searchParams.get('verified') === 'true';
  const passwordUpdated = searchParams.get('passwordUpdated') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setUnverifiedEmail(null);

    try {
      await signIn(data);
      // Successful sign in, redirect to target page
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      const error = err as { message?: string; status?: number };
      const msg = error.message || 'Failed to sign in. Please try again.';
      if (
        msg.toLowerCase().includes('email not confirmed') ||
        msg.toLowerCase().includes('confirm your email') ||
        error.status === 400 && msg.toLowerCase().includes('verification')
      ) {
        setUnverifiedEmail(data.email);
        setErrorMsg('Your email is not verified yet. Please check your inbox or resend the verification link.');
      } else {
        setErrorMsg(msg);
      }
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unverifiedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Verification email resent! Please check your inbox.');
        setUnverifiedEmail(null);
      }
    } catch (err) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'An error occurred while resending the email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-dark-900 grid-bg hero-gradient px-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-eco-500/10 bg-dark-800/85 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Top Glow Decorator */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="text-center space-y-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20 text-white font-bold text-lg mb-2"
            >
              E
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-stone-400 text-sm">
              Sign in to continue tracking your climate impact
            </p>
          </div>

          {/* Verification Banners */}
          {verified && !successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Email verified successfully! You can now log in.</span>
            </div>
          )}

          {passwordUpdated && !successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Password updated! Please sign in with your new credentials.</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl" role="alert">
              <AlertCircle size={16} className="shrink-0" />
              <div className="space-y-1">
                <p>{errorMsg}</p>
                {unverifiedEmail && (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    type="button"
                    className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 flex items-center gap-1 mt-1 outline-none"
                  >
                    {resending ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Resending...</span>
                      </>
                    ) : (
                      <span>Resend Verification Email</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-stone-400">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
                className="w-full px-4 py-2.5 bg-dark-900 border border-eco-500/10 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-semibold text-stone-400">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 btn-primary rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <p className="text-stone-400 text-xs text-center">
            New to EcoGuide AI?{' '}
            <Link
              href="/signup"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
