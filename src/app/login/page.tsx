'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Lock, Mail, User, Phone, Eye, EyeOff, CheckCircle2, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getSafeRedirectUrl } from '@/lib/safeRedirect';

function CustomerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loginCustomer, registerCustomer, resetPasswordForEmail } = useAuth();
  const { syncGuestCart } = useCart();

  // Validate and sanitize destination URL
  const rawRedirect = searchParams.get('redirect') || searchParams.get('next');
  const safeDestination = getSafeRedirectUrl(rawRedirect, '/profile');

  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'forgot'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<string | null>(null);

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');

  React.useEffect(() => {
    if (searchParams.get('tab') === 'register') {
      setActiveTab('register');
    } else if (searchParams.get('tab') === 'forgot') {
      setActiveTab('forgot');
    }
  }, [searchParams]);

  // If already logged in, redirect or display status
  if (user && user.role === 'customer') {
    return (
      <div className="bg-[#FAF7F2] min-h-[80vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E8D6C7] shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#E8D6C7]/50 text-[#392820] flex items-center justify-center mx-auto border border-[#D9A08C]">
            <Sparkles className="w-8 h-8 text-[#D9A08C]" />
          </div>
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-[#D9A08C] font-semibold">
              Privilege Circle Member
            </span>
            <h2 className="font-serif text-2xl text-[#392820] font-medium">
              Welcome back, {user.name}
            </h2>
            <p className="text-xs text-[#735D50]">
              You are signed in as <span className="font-medium text-[#392820]">{user.email}</span>
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href={safeDestination}
              className="w-full py-3 rounded-full bg-[#392820] text-[#FAF7F2] font-semibold text-xs tracking-wider uppercase hover:bg-[#111111] transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Continue to {safeDestination === '/profile' ? 'My Profile' : 'Destination'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/products"
              className="w-full py-3 rounded-full border border-[#D9A08C] text-[#392820] font-semibold text-xs tracking-wider uppercase hover:bg-[#FAF7F2] transition-all"
            >
              Explore Boutique Collection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await loginCustomer(email, password);
    setLoading(false);

    if (res.success) {
      // Synchronize cart on login without duplicates
      syncGuestCart();

      if (res.role === 'admin') {
        router.push('/admin');
      } else {
        // Redirect directly to the Nilora home page as requested
        const targetDestination = rawRedirect && rawRedirect !== '/profile' ? safeDestination : '/';
        router.push(targetDestination);
      }
    } else {
      setErrorMessage(
        res.error || 'The email or password entered is incorrect. Please check your credentials and try again.'
      );
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await registerCustomer({
      name: regName,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
    });
    setLoading(false);

    if (res.success) {
      if (res.requiresVerification) {
        setVerificationPendingEmail(res.email || regEmail);
      } else {
        // Switch to sign in tab, prefill the registered email, and prompt user to sign in
        setActiveTab('signin');
        setEmail(regEmail.trim());
        setPassword('');
        setRegPassword('');
        setSuccessMessage('Account created successfully! Please sign in with your email and password to enter Nilora.');
      }
    } else {
      setErrorMessage(res.error || 'Failed to create account. Please check your details.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await resetPasswordForEmail(forgotEmail);
    setLoading(false);

    if (res.success) {
      setSuccessMessage(
        `A secure password reset link has been dispatched to ${forgotEmail}. Please check your inbox to reset your password.`
      );
    } else {
      setErrorMessage(res.error || 'Failed to send password reset link. Please check your email and try again.');
    }
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <BrandLogo className="mx-auto" />
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-[0.25em] text-[#D9A08C] font-semibold">
              Nilora Privilege Circle
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#392820] font-medium">
              Client Boutique Portal
            </h1>
            <p className="text-xs sm:text-sm text-[#735D50] max-w-md mx-auto">
              Sign in to manage your artisanal wardrobe, track royal deliveries, and access exclusive festive curations.
            </p>
          </div>
        </div>

        {/* Verification Pending Screen */}
        {verificationPendingEmail ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8D6C7] shadow-xl text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <Mail className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#D9A08C] font-semibold">
                Verification Required
              </span>
              <h2 className="font-serif text-2xl text-[#392820] font-medium">
                Check Your Inbox
              </h2>
              <p className="text-xs text-[#735D50] leading-relaxed max-w-sm mx-auto">
                We have sent an activation link to <strong className="text-[#392820]">{verificationPendingEmail}</strong>. Please click the link to confirm your email and activate boutique privileges.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8D6C7] text-left text-xs space-y-2">
              <p className="font-semibold text-[#392820]">Next Steps:</p>
              <ul className="list-disc list-inside text-[#735D50] space-y-1 text-[11px]">
                <li>Check your inbox and spam folder for an email from Nilora Trends.</li>
                <li>Click the confirmation button or link.</li>
                <li>Return here to sign in with your password.</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setVerificationPendingEmail(null);
                setActiveTab('signin');
              }}
              className="w-full py-3.5 rounded-full bg-[#392820] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] transition-all cursor-pointer shadow-md"
            >
              Proceed to Sign In
            </button>
          </div>
        ) : (
          /* Main Card with Tabs */
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8D6C7] shadow-xl space-y-6">
            
            {/* Tabs */}
            <div className="flex rounded-full bg-[#FAF7F2] p-1.5 border border-[#E8D6C7]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-[#392820] text-[#FAF7F2] shadow-sm'
                    : 'text-[#735D50] hover:text-[#392820]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-[#392820] text-[#FAF7F2] shadow-sm'
                    : 'text-[#735D50] hover:text-[#392820]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#392820] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#D9A08C]" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 rounded-2xl border border-[#E8D6C7] bg-[#FAF7F2]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D9A08C] text-sm text-[#392820] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase tracking-wider font-semibold text-[#392820] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#D9A08C]" />
                      <span>Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setForgotEmail(email);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-[#D9A08C] hover:underline font-semibold cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your boutique password"
                      className="w-full px-4 py-3 pr-11 rounded-2xl border border-[#E8D6C7] bg-[#FAF7F2]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D9A08C] text-sm text-[#392820] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#735D50] hover:text-[#392820] cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-full bg-[#392820] text-[#FAF7F2] font-semibold text-xs tracking-wider uppercase hover:bg-[#111111] disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer pt-3"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Nilora'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* 2. REGISTER FORM */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#392820] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#D9A08C]" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Aditi Sharma"
                    className="w-full px-4 py-3 rounded-2xl border border-[#E8D6C7] bg-[#FAF7F2]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D9A08C] text-sm text-[#392820] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#392820] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#D9A08C]" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="aditi.sharma@example.com"
                    className="w-full px-4 py-3 rounded-2xl border border-[#E8D6C7] bg-[#FAF7F2]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D9A08C] text-sm text-[#392820] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#392820] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#D9A08C]" />
                    <span>Mobile Number (Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-2xl border border-[#E8D6C7] bg-[#FAF7F2]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D9A08C] text-sm text-[#392820] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#392820] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#D9A08C]" />
                    <span>Password (Minimum 8 characters)</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full px-4 py-3 rounded-2xl border border-[#E8D6C7] bg-[#FAF7F2]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D9A08C] text-sm text-[#392820] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-full bg-[#392820] text-[#FAF7F2] font-semibold text-xs tracking-wider uppercase hover:bg-[#111111] disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer pt-3"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                  <Sparkles className="w-4 h-4 text-[#D9A08C]" />
                </button>
              </form>
            )}

            {/* 3. FORGOT PASSWORD FORM */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-left space-y-1 pb-1">
                  <h3 className="font-serif text-lg text-[#392820] font-semibold flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#D9A08C]" />
                    <span>Reset Your Password</span>
                  </h3>
                  <p className="text-xs text-[#735D50]">
                    Enter your registered email address and we will dispatch a secure reset link.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#392820] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#D9A08C]" />
                    <span>Registered Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 rounded-2xl border border-[#E8D6C7] bg-[#FAF7F2]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D9A08C] text-sm text-[#392820] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-[#392820] text-[#FAF7F2] font-semibold text-xs tracking-wider uppercase hover:bg-[#111111] disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Sending Recovery Link...' : 'Send Password Reset Link'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-[#735D50] hover:text-[#392820] hover:underline cursor-pointer"
                  >
                    &larr; Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Privilege Circle Benefits Callout */}
            <div className="pt-4 border-t border-[#E8D6C7] grid grid-cols-2 gap-4 text-center">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#392820] block">
                  Royal Privileges
                </span>
                <p className="text-[10px] text-[#735D50]">
                  Early festive drop access
                </p>
              </div>
              <div className="space-y-1 border-l border-[#E8D6C7]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#392820] block">
                  Complimentary Shipping
                </span>
                <p className="text-[10px] text-[#735D50]">
                  On orders above ₹1,999
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-xs text-[#735D50]">Loading Nilora portal...</div>}>
      <CustomerLoginContent />
    </Suspense>
  );
}
