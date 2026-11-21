'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if recovery session is active
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setHasValidSession(true);
        } else {
          const hasHashOrCode =
            typeof window !== 'undefined' &&
            (window.location.hash.includes('access_token') ||
              window.location.search.includes('code') ||
              window.location.hash.includes('type=recovery'));
          if (!hasHashOrCode) {
            setHasValidSession(false);
          }
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (
          event === 'PASSWORD_RECOVERY' ||
          (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION'))
        ) {
          setHasValidSession(true);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // In preview/demo mode, allow testing the UI
      setHasValidSession(true);
    }
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must contain at least 8 characters for security.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        // In demo preview mode: update password in local registered customers
        try {
          const pendingEmail = localStorage.getItem('nilora_reset_pending_email');
          const registeredRaw = localStorage.getItem('nilora_registered_customers');
          const registered = registeredRaw ? JSON.parse(registeredRaw) : [];
          if (pendingEmail) {
            const userIdx = registered.findIndex(
              (u: any) => u.email && u.email.toLowerCase() === pendingEmail.toLowerCase()
            );
            if (userIdx !== -1) {
              registered[userIdx].password = password;
              localStorage.setItem('nilora_registered_customers', JSON.stringify(registered));
            }
          }
        } catch {}
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-16 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#E8D6C7] shadow-xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <BrandLogo className="mx-auto" />
          <span className="text-xs uppercase tracking-[0.25em] text-[#D9A08C] font-semibold block pt-2">
            Secure Account Recovery
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#392820] font-medium">
            Reset Your Password
          </h1>
          <p className="text-xs text-[#735D50]">
            Enter your new Nilora Privilege Circle password below.
          </p>
        </div>

        {/* State: Session missing / expired */}
        {hasValidSession === false && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3 text-center">
            <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
            <p className="font-semibold">Recovery Session Expired or Invalid</p>
            <p className="text-[11px] text-amber-800">
              The password reset link may have expired or was already used. Please request a new link from the login page.
            </p>
            <Link
              href="/login"
              className="inline-block py-2 px-5 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#B79A72]"
            >
              Return to Sign In
            </Link>
          </div>
        )}

        {/* State: Success */}
        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="font-serif text-lg text-emerald-900 font-semibold">
              Password Successfully Updated!
            </h3>
            <p className="text-xs text-emerald-700">
              Your new password is now active. Redirecting you to your boutique account...
            </p>
            <div className="pt-2">
              <Link
                href="/profile"
                className="py-2.5 px-6 rounded-full bg-[#392820] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] inline-flex items-center gap-1.5"
              >
                <span>Go to Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          hasValidSession !== false && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#735D50] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#735D50] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl border border-[#E8D6C7] text-xs text-[#392820] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D9A08C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#735D50] hover:text-[#392820] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#735D50] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#735D50] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl border border-[#E8D6C7] text-xs text-[#392820] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D9A08C]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-[#392820] text-[#FAF7F2] text-xs font-semibold tracking-wider uppercase hover:bg-[#111111] disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <span>Updating Password...</span>
                ) : (
                  <span>Save New Password</span>
                )}
              </button>
            </form>
          )
        )}

        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="text-xs text-[#735D50] hover:text-[#392820] hover:underline"
          >
            &larr; Back to Nilora Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
