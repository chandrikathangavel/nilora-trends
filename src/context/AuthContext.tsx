'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAccount } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getSafeRedirectUrl } from '@/lib/safeRedirect';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  preference?: string;
}

interface AuthContextType {
  user: UserAccount | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loginCustomer: (email: string, password?: string) => Promise<{ success: boolean; error?: string; role?: 'customer' | 'admin' }>;
  registerCustomer: (data: RegisterData) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean; email?: string }>;
  loginWithGoogle: (intendedDestination?: string, emailHint?: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  setCustomAdminCredentials: (email: string, pass: string) => void;
  updateUserProfile: (updates: Partial<UserAccount>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_ADMIN_EMAIL = 'niloratrends@gmail.com';
const DEFAULT_ADMIN_PASS = 'UmaThangavel11';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveUserSession = (account: UserAccount | null) => {
    setUser(account);
    if (account) {
      // Session metadata cache (never store passwords or tokens here)
      localStorage.setItem('nilora_current_user', JSON.stringify(account));
    } else {
      localStorage.removeItem('nilora_current_user');
    }
  };

  const getAdminCredentials = () => {
    let email = DEFAULT_ADMIN_EMAIL;
    let pass = DEFAULT_ADMIN_PASS;
    try {
      const customEmail = localStorage.getItem('nilora_custom_admin_email');
      const customPass = localStorage.getItem('nilora_custom_admin_password');
      if (customEmail && customPass) {
        email = customEmail;
        pass = customPass;
      }
    } catch {}
    return { email: email.toLowerCase().trim(), pass };
  };

  const setCustomAdminCredentials = (newEmail: string, newPass: string) => {
    try {
      localStorage.setItem('nilora_custom_admin_email', newEmail.trim());
      localStorage.setItem('nilora_custom_admin_password', newPass);
    } catch (e) {
      console.error('Failed to store custom admin credentials', e);
    }
  };

  const syncUserFromSession = useCallback(async (authUser: any) => {
    try {
      const { email: activeAdminEmail } = getAdminCredentials();

      // Check admin status server/database
      let isAdminRole = authUser.email?.toLowerCase() === activeAdminEmail;
      if (!isAdminRole) {
        const { data: adminRole } = await (supabase as any)
          .from('admin_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .in('role', ['superadmin', 'admin', 'manager'])
          .maybeSingle();

        if (adminRole) {
          isAdminRole = true;
        }
      }

      // Fetch user profile from public.profiles
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const fullName =
        profile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'Boutique Patron';

      const userAccount: UserAccount = {
        id: authUser.id,
        name: fullName,
        email: authUser.email || '',
        phone: profile?.phone || authUser.user_metadata?.phone || '',
        avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url || '',
        role: isAdminRole ? 'admin' : 'customer',
        privilegeTier: isAdminRole ? 'Boutique Administrator' : 'Nilora Privilege Circle',
        joinedDate: new Date(authUser.created_at || Date.now()).toLocaleDateString('en-IN', {
          month: 'short',
          year: 'numeric',
        }),
      };

      saveUserSession(userAccount);
    } catch (err) {
      console.error('Failed to sync user from session:', err);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    if (isSupabaseConfigured) {
      // 1. Check active Supabase session
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          await syncUserFromSession(session.user);
        } else {
          // Fallback to local session if present
          try {
            const stored = localStorage.getItem('nilora_current_user');
            if (stored) setUser(JSON.parse(stored));
          } catch {}
        }
        setIsLoading(false);
      });

      // 2. Listen to Auth State Changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED')) {
          await syncUserFromSession(session.user);
        } else if (event === 'SIGNED_OUT') {
          saveUserSession(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Demo preview mode
      try {
        const stored = localStorage.getItem('nilora_current_user');
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to parse current user session', e);
      } finally {
        setIsLoading(false);
      }
    }
  }, [syncUserFromSession]);

  const loginCustomer = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; role?: 'customer' | 'admin' }> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const { email: activeAdminEmail, pass: activeAdminPass } = getAdminCredentials();

    // Check if entered credentials match master Admin credentials
    if (trimmedEmail === activeAdminEmail) {
      if (password === activeAdminPass) {
        const adminAccount: UserAccount = {
          id: 'admin-master',
          name: 'Nilora Administrator',
          email: trimmedEmail,
          role: 'admin',
          privilegeTier: 'Boutique Administrator',
          joinedDate: 'Atelier Launch 2026',
        };
        saveUserSession(adminAccount);
        return { success: true, role: 'admin' };
      } else {
        return { success: false, error: 'Incorrect administrator password.' };
      }
    }

    // 1. Live Supabase Authentication
    if (isSupabaseConfigured) {
      if (!password) {
        return { success: false, error: 'Please enter your account password.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return {
            success: false,
            error: 'Your email address has not been confirmed yet. Please verify your email using the link sent to your inbox.',
          };
        }
        return {
          success: false,
          error: 'The email or password entered is incorrect. Please check your credentials and try again.',
        };
      }

      if (data.user) {
        await syncUserFromSession(data.user);
        return { success: true, role: 'customer' };
      }
    }

    // 2. Demo preview mode fallback
    try {
      const registeredRaw = localStorage.getItem('nilora_registered_customers');
      const registered: Array<UserAccount & { password?: string }> = registeredRaw ? JSON.parse(registeredRaw) : [];

      const existing = registered.find((c) => c.email.toLowerCase() === trimmedEmail);
      if (!existing || existing.password !== password) {
        return {
          success: false,
          error: 'The email or password entered is incorrect. Please check your credentials and try again.',
        };
      }

      const { password: _, ...customerData } = existing;
      saveUserSession(customerData);
      return { success: true, role: 'customer' };
    } catch {
      return { success: false, error: 'Authentication service temporarily unavailable.' };
    }
  };

  const registerCustomer = async (
    data: RegisterData
  ): Promise<{ success: boolean; error?: string; requiresVerification?: boolean; email?: string }> => {
    const trimmedEmail = data.email.trim().toLowerCase();
    if (!trimmedEmail || !data.name.trim()) {
      return { success: false, error: 'Please provide both your full name and email address.' };
    }

    if (!data.password || data.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters for security.' };
    }

    const { email: activeAdminEmail } = getAdminCredentials();
    if (trimmedEmail === activeAdminEmail) {
      return { success: false, error: 'This email is reserved for boutique administrative management.' };
    }

    // 1. Live Supabase Registration via Server API (Instant auto-confirmed, no activation email blocking)
    if (isSupabaseConfigured) {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim(),
            email: trimmedEmail,
            password: data.password,
            phone: data.phone?.trim() || '',
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          return {
            success: false,
            error: result.error || 'Failed to create boutique account. Please try again.',
          };
        }

        // Account is saved and immediately verified in Supabase!
        // No email verification barrier: take user straight to the Sign In tab.
        return {
          success: true,
          requiresVerification: false,
          email: trimmedEmail,
        };
      } catch (err: unknown) {
        console.error('Registration fetch error:', err);
        return {
          success: false,
          error: 'Unable to connect to boutique registration service. Please try again.',
        };
      }
    }

    // 2. Demo preview mode fallback
    try {
      const registeredRaw = localStorage.getItem('nilora_registered_customers');
      const registered: Array<UserAccount & { password?: string }> = registeredRaw ? JSON.parse(registeredRaw) : [];

      const existing = registered.find((c) => c.email.toLowerCase() === trimmedEmail);
      if (existing) {
        return { success: false, error: 'An account with this email address already exists. Please sign in instead.' };
      }

      const newCustomer: UserAccount = {
        id: `cust-${Date.now()}`,
        name: data.name.trim(),
        email: trimmedEmail,
        phone: data.phone?.trim() || '',
        role: 'customer',
        privilegeTier: 'Nilora Privilege Circle (New Member)',
        joinedDate: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      };

      registered.push({ ...newCustomer, password: data.password });
      localStorage.setItem('nilora_registered_customers', JSON.stringify(registered));

      // Do not auto-login; user is returned to the sign-in page to log in
      return { success: true, requiresVerification: false, email: trimmedEmail };
    } catch {
      return { success: false, error: 'Failed to complete registration.' };
    }
  };

  const loginWithGoogle = async (
    intendedDestination?: string,
    emailHint?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. If live Supabase is configured, initiate Google OAuth redirect
    if (isSupabaseConfigured) {
      try {
        const safeTarget = getSafeRedirectUrl(intendedDestination, '/profile');
        const redirectTo =
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(safeTarget)}`
            : `http://localhost:3000/auth/callback?redirect=${encodeURIComponent(safeTarget)}`;

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        });

        if (!error) {
          return { success: true };
        }
        console.warn('Supabase Google OAuth initialization notice:', error.message);
      } catch (err: unknown) {
        console.warn('Supabase Google OAuth exception:', err);
      }
    }

    // Google OAuth disabled / not configured
    return {
      success: false,
      error: 'Google Sign-In is disabled for privacy and security. Please sign in with your registered email and password.',
    };
  };

  const resetPasswordForEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (isSupabaseConfigured) {
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          return {
            success: false,
            error: result.error || 'Failed to dispatch password reset request.',
          };
        }

        return { success: true };
      } catch (err: unknown) {
        console.error('Forgot password fetch error:', err);
        return {
          success: false,
          error: 'Network error while requesting password reset. Please try again.',
        };
      }
    }

    // Demo preview mode
    try {
      localStorage.setItem('nilora_reset_pending_email', trimmedEmail);
    } catch {}
    return { success: true };
  };

  const loginAdmin = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const { email: activeAdminEmail, pass: activeAdminPass } = getAdminCredentials();

    if (trimmedEmail !== activeAdminEmail) {
      return {
        success: false,
        error: 'Unauthorized email ID. Access is strictly restricted to Nilora Trends administrators.',
      };
    }

    if (password !== activeAdminPass) {
      return { success: false, error: 'Invalid administrator password.' };
    }

    const adminAccount: UserAccount = {
      id: 'admin-master',
      name: 'Nilora Administrator',
      email: trimmedEmail,
      role: 'admin',
      privilegeTier: 'Boutique Administrator',
      joinedDate: 'Atelier Launch 2026',
    };
    saveUserSession(adminAccount);
    return { success: true };
  };

  const updateUserProfile = async (updates: Partial<UserAccount>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No active session found.' };
    }

    if (isSupabaseConfigured && user.id && !user.id.startsWith('cust-') && user.id !== 'admin-master') {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          full_name: updates.name ?? user.name,
          phone: updates.phone ?? user.phone,
          avatar_url: updates.avatarUrl ?? user.avatarUrl,
        })
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    const updatedUser: UserAccount = {
      ...user,
      ...updates,
    };

    saveUserSession(updatedUser);

    if (updatedUser.role === 'customer') {
      try {
        const raw = localStorage.getItem('nilora_registered_customers');
        const registered: Array<UserAccount & { password?: string }> = raw ? JSON.parse(raw) : [];
        const index = registered.findIndex(
          (c) => c.email.toLowerCase() === user.email.toLowerCase() || c.id === user.id
        );
        if (index !== -1) {
          registered[index] = {
            ...registered[index],
            ...updates,
          };
        } else {
          registered.push(updatedUser);
        }
        localStorage.setItem('nilora_registered_customers', JSON.stringify(registered));
      } catch (e) {
        console.error('Failed to update customer in registered list', e);
      }
    }

    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    saveUserSession(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('nilora_saved_addresses_v2');
        localStorage.removeItem('nilora_saved_addresses');
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === 'admin',
        isAuthenticated: !!user,
        loginCustomer,
        registerCustomer,
        loginWithGoogle,
        resetPasswordForEmail,
        loginAdmin,
        setCustomAdminCredentials,
        updateUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
