'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loginAdmin } = useAuth();

  // 2-Step Authentication State: Step 1 (Admin Email Verification) -> Step 2 (Admin Security Passkey)
  const [step, setStep] = useState<1 | 2>(1);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated as admin, provide quick jump to console
  if (user && user.role === 'admin') {
    return (
      <div className="bg-[#231813] min-h-screen flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-[#392820] text-[#FAF7F2] rounded-3xl p-8 border border-[#D9A08C]/30 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-[#D9A08C] font-semibold">
              Authorized Administrator Session Active
            </span>
            <h2 className="font-serif text-2xl font-medium">
              Welcome, {user.name}
            </h2>
            <p className="text-xs text-[#FAF7F2]/70">
              Authenticated as <span className="text-white font-mono">{user.email}</span>
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/admin"
              className="w-full py-3 rounded-full bg-[#D9A08C] text-[#231813] font-bold text-xs tracking-wider uppercase hover:bg-white transition-all shadow-lg"
            >
              Open Admin Management Console &rarr;
            </Link>
            <Link
              href="/"
              className="w-full py-3 rounded-full border border-white/20 text-[#FAF7F2] font-semibold text-xs tracking-wider uppercase hover:bg-white/10 transition-all"
            >
              View Public Boutique Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // STEP 1: Verify Administrator Identity
  const handleVerifyEmailStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your authorized administrator email ID.');
      return;
    }

    // Check if email matches authorized admin format
    const validEmails = ['niloratrends@gmail.com'];
    const customAdminEmail = typeof window !== 'undefined' ? localStorage.getItem('nilora_custom_admin_email') : null;
    if (customAdminEmail) {
      validEmails.push(customAdminEmail.toLowerCase());
    }

    if (!validEmails.includes(cleanEmail)) {
      setError('Access Denied: This email ID is not recognized as an authorized Nilora Trends administrator.');
      return;
    }

    // Step 1 Passed -> Proceed to Step 2 (Password)
    setStep(2);
  };

  // STEP 2: Authenticate Security Passkey
  const handleAuthenticateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await loginAdmin(adminEmail, adminPassword);
    setLoading(false);

    if (res.success) {
      router.push('/admin');
    } else {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="bg-[#231813] min-h-screen py-12 sm:py-20 px-4 sm:px-6 flex flex-col justify-center items-center text-[#FAF7F2]">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header Brand Crest */}
        <div className="text-center space-y-3">
          <div className="inline-block p-3 rounded-2xl bg-white/5 border border-[#D9A08C]/30 backdrop-blur-sm">
            <BrandLogo />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9A08C]/20 border border-[#D9A08C]/40 text-[#D9A08C] text-[11px] font-semibold tracking-widest uppercase">
              <Shield className="w-3.5 h-3.5" />
              <span>Strictly Restricted Gateway</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-white font-medium">
              Administrator Access
            </h1>
            <p className="text-xs text-[#FAF7F2]/60 max-w-sm mx-auto">
              Only authorized Nilora Trends directors and inventory controllers may authenticate.
            </p>
          </div>
        </div>

        {/* Security Progress Indicator */}
        <div className="flex items-center justify-between px-6 py-2 bg-white/5 rounded-2xl border border-white/10 text-xs">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-[#D9A08C] font-semibold' : 'text-emerald-400 font-medium'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 1 ? 'bg-[#D9A08C] text-[#231813]' : 'bg-emerald-500 text-white'
            }`}>
              {step > 1 ? '✓' : '1'}
            </span>
            <span>Step 1: Admin ID</span>
          </div>

          <div className="w-8 h-[1px] bg-white/20" />

          <div className={`flex items-center gap-2 ${step === 2 ? 'text-[#D9A08C] font-semibold' : 'text-[#FAF7F2]/40'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 2 ? 'bg-[#D9A08C] text-[#231813]' : 'bg-white/10 text-white/40'
            }`}>
              2
            </span>
            <span>Step 2: Security Passkey</span>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-[#312119] rounded-3xl p-6 sm:p-8 border border-[#D9A08C]/30 shadow-2xl space-y-6">
          
          {error && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-500/50 text-rose-200 rounded-2xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SEPARATE EMAIL ID INPUT */}
          {step === 1 ? (
            <form onSubmit={handleVerifyEmailStep} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-[#E8D6C7] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#D9A08C]" />
                  <span>Authorized Administrator Email ID</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="niloratrends@gmail.com"
                  className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#D9A08C] text-sm transition-all"
                />
                <p className="text-[11px] text-[#FAF7F2]/50 italic">
                  Enter your registered Nilora Trends administrative email address.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#D9A08C] text-[#231813] font-bold text-xs tracking-widest uppercase hover:bg-white transition-all shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <span>Verify Admin Identity</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: SEPARATE PASSWORD / PASSKEY INPUT */
            <form onSubmit={handleAuthenticateAdmin} className="space-y-4">
              {/* Confirmed Email Tag */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-emerald-500/30">
                <div className="flex items-center gap-2 overflow-hidden">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-mono text-white truncate">{adminEmail}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="text-[11px] text-[#D9A08C] hover:underline flex items-center gap-1 shrink-0 ml-2"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-[#E8D6C7] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#D9A08C]" />
                  <span>Admin Master Security Password</span>
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#D9A08C] text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-[#D9A08C] text-[#231813] font-bold text-xs tracking-widest uppercase hover:bg-white transition-all shadow-md disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Authorizing Session...</span>
                ) : (
                  <>
                    <span>Unlock Admin Console</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs text-[#FAF7F2]/60 hover:text-white transition-colors"
              >
                &larr; Back to Email Verification
              </button>
            </form>
          )}

          {/* Security Notice */}
          <div className="pt-2 border-t border-white/10 text-center">
            <p className="text-[10px] text-[#FAF7F2]/40 leading-relaxed">
              All administrative sessions are logged with IP tracking. Unauthorized access attempts will result in permanent credential revocation.
            </p>
          </div>
        </div>

        {/* Link back to Customer Store */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#FAF7F2]/70 hover:text-[#D9A08C] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Nilora Trends Boutique Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
