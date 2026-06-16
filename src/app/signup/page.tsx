'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

// Production password strength regex validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const signupSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)'
    ),
});

type SignupSchema = z.infer<typeof signupSchema>;

/**
 * SignupPage renders the user onboarding account registration form.
 *
 * Implements:
 * 1. Zod complex password schema validation.
 * 2. Redirect to verification info route upon successful registration.
 * 3. Accessibility elements for validation alerts.
 */
export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupSchema) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      await signUp(data);
      // Redirect unconfirmed user to verify email helper page
      router.push('/verify-email');
    } catch (err) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Failed to create account. Please try again.');
      setLoading(false);
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
            <h1 className="text-2xl font-bold tracking-tight text-white">Create your account</h1>
            <p className="text-stone-400 text-sm">
              Start monitoring and optimizing your home carbon footprint
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
              <label htmlFor="displayName" className="text-xs font-semibold text-stone-400">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                placeholder="Jane Doe"
                autoComplete="name"
                aria-invalid={!!errors.displayName}
                aria-describedby={errors.displayName ? 'displayName-error' : undefined}
                {...register('displayName')}
                className="w-full px-4 py-2.5 bg-dark-900 border border-eco-500/10 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {errors.displayName && (
                <p id="displayName-error" className="text-xs text-red-400">
                  {errors.displayName.message}
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
                className="w-full px-4 py-2.5 bg-dark-900 border border-eco-500/10 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
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
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Sign Up</span>
              )}
            </button>
          </form>

          <p className="text-stone-400 text-xs text-center">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
