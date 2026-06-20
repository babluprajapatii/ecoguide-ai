'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/\d/, 'Password must contain at least 1 number'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterSchema = z.infer<typeof registerSchema>;

/**
 * RegisterPage renders the user onboarding account registration form.
 *
 * Implements:
 * 1. Zod complex password schema validation.
 * 2. Password and Confirm Password match validation.
 * 3. Redirect to verification info route upon successful registration.
 * 4. Premium SaaS UI with dark/light theme compatibilities.
 */
export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterSchema) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      await signUp({
        email: data.email,
        password: data.password,
        displayName: data.fullName,
      });
      // Redirect unconfirmed user to verify email helper page
      router.push('/verify-email');
    } catch (err) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="grid-bg hero-gradient flex min-h-screen items-center justify-center bg-dark-900 px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-eco-500/10 bg-dark-800/85 p-8 shadow-2xl backdrop-blur-md">
        {/* Top Glow Decorator */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="space-y-2 text-center">
            <Link
              href="/"
              className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-500/20"
            >
              E
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">Create your account</h1>
            <p className="text-sm text-stone-400">
              Start monitoring and optimizing your home carbon footprint
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
              <label htmlFor="fullName" className="text-xs font-semibold text-stone-400">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Jane Doe"
                autoComplete="name"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                {...register('fullName')}
                className="w-full rounded-xl border border-eco-500/10 bg-dark-900 px-4 py-2.5 text-sm text-stone-200 transition-colors focus:border-emerald-500 focus:outline-none"
              />
              {errors.fullName && (
                <p id="fullName-error" className="text-xs text-red-400">
                  {errors.fullName.message}
                </p>
              )}
            </div>

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
                className="w-full rounded-xl border border-eco-500/10 bg-dark-900 px-4 py-2.5 text-sm text-stone-200 transition-colors focus:border-emerald-500 focus:outline-none"
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-semibold text-stone-400">
                Password
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
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  {...register('confirmPassword')}
                  className="w-full rounded-xl border border-eco-500/10 bg-dark-900 py-2.5 pl-4 pr-10 text-sm text-stone-200 transition-colors focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-stone-500 outline-none hover:text-stone-300"
                  aria-label={
                    showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                  }
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Sign Up</span>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-stone-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
