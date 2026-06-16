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
    <main className="min-h-screen flex items-center justify-center bg-dark-900 grid-bg hero-gradient px-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-eco-500/10 bg-dark-800/85 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Top Glow Decorator */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-6">
          {/* Logo Brand Icon */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20 text-white font-bold text-xl mx-auto">
            E
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Check your email</h1>
            <p className="text-stone-400 text-sm">
              We sent a verification link to your inbox. Click the link to activate your account.
            </p>
          </div>

          <div className="flex justify-center py-2">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/25 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Mail size={32} />
              </div>
            </div>
          </div>

          {/* Success / Error Banners */}
          {message && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-left" role="alert">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl text-left" role="alert">
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
                className="w-full px-4 py-2.5 bg-dark-900 border border-eco-500/10 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 btn-primary rounded-xl text-white font-medium text-sm disabled:opacity-50 transition-opacity"
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

          <p className="text-xs text-stone-500 pt-2">
            Ready to log in?{' '}
            <Link
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
