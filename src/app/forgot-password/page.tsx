'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

/**
 * ForgotPasswordPage renders the request form for password recovery emails.
 */
export default function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await resetPasswordForEmail(data.email);
      setSuccessMsg('Check your email! A password recovery link has been sent to your inbox.');
    } catch (err) {
      const error = err as { message?: string };
      setErrorMsg(
        error.message || 'Failed to send recovery email. Please verify the email and try again.',
      );
    } finally {
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
            <h1 className="text-2xl font-bold tracking-tight text-white">Reset your password</h1>
            <p className="text-sm text-stone-400">
              We will email you a link to reset your account password
            </p>
          </div>

          {/* Success / Error Banners */}
          {successMsg && (
            <div
              className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400"
              role="alert"
            >
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Sending email...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>

          <p className="pt-2 text-center text-xs text-stone-400">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 hover:text-emerald-300"
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
