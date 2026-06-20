'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * VerifyEmailPage informs users to check their email for a verification link
 * and offers a resend function to prevent signup deadlocks.
 */
export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setMessage('Verification email resent! Please check your inbox.');
      }
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || 'An error occurred while resending.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid-bg hero-gradient flex min-h-screen items-center justify-center bg-dark-900 px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-eco-500/10 bg-dark-800/85 p-8 shadow-2xl backdrop-blur-md">
        {/* Top Glow Decorator */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="space-y-6 text-center">
          {/* Logo Brand Icon */}
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-bold text-white shadow-lg shadow-emerald-500/20">
            E
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Check your email</h1>
            <p className="text-sm text-stone-400">
              We sent a verification link to your inbox. Click the link to activate your account.
            </p>
          </div>

          <div className="flex justify-center py-2">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/25 blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Mail size={32} />
              </div>
            </div>
          </div>

          {/* Success / Error Banners */}
          {message && (
            <div
              className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-left text-xs text-emerald-400"
              role="alert"
            >
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-left text-xs text-red-400"
              role="alert"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <hr className="border-eco-500/10" />

          {/* Resend Verification Form */}
          <form onSubmit={handleResend} className="space-y-4 text-left">
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-stone-400">
                {"Didn't receive the email? Resend it:"}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full rounded-xl border border-eco-500/10 bg-dark-900 px-4 py-2.5 text-sm text-stone-200 transition-colors focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Resending...</span>
                </>
              ) : (
                <>
                  <span>Resend Verification Link</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="pt-2 text-xs text-stone-500">
            Ready to log in?{' '}
            <Link
              href="/login"
              className="font-semibold text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
