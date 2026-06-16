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
      setErrorMsg(error.message || 'Failed to send recovery email. Please verify the email and try again.');
    } finally {
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
            <h1 className="text-2xl font-bold tracking-tight text-white">Reset your password</h1>
            <p className="text-stone-400 text-sm">
              We will email you a link to reset your account password
            </p>
          </div>

          {/* Success / Error Banners */}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl" role="alert">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl" role="alert">
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
                className="w-full px-4 py-2.5 bg-dark-900 border border-eco-500/10 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
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
              className="w-full py-2.5 btn-primary rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
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

          <p className="text-stone-400 text-xs text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold"
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
