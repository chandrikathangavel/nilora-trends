import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  '';

/**
 * Server-side public client (safe for server components and routes with caller context)
 */
export function createServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase client credentials are not configured in environment variables.');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Server-only Admin Client using SUPABASE_SERVICE_ROLE_KEY.
 * STRICTURE: NEVER IMPORT THIS FILE INTO CLIENT COMPONENTS ('use client').
 * Bypasses RLS strictly for trusted server-side administrative procedures, migrations & inventory audits.
 */
export function createAdminServerClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for privileged server-side operations.');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Verify whether an authenticated user is an authorized Nilora Trends administrator.
 * Performs a verified server-side check.
 */
export async function verifyAdminServer(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    // If service role key is present, perform secure direct query
    if (supabaseServiceRoleKey) {
      const adminClient = createAdminServerClient();
      const { data, error } = await adminClient
        .from('admin_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['superadmin', 'admin', 'manager'])
        .maybeSingle();

      if (error) {
        console.error('Admin role server check error:', error.message);
        return false;
      }

      return Boolean(data);
    }

    // Fallback: Check using is_admin RPC with anon key
    const client = createServerClient();
    const { data: isAdmin, error } = await (client as any).rpc('is_admin', { check_user_id: userId });
    if (error) {
      console.warn('RPC is_admin error:', error.message);
      return false;
    }

    return Boolean(isAdmin);
  } catch (err) {
    console.error('Failed to verify admin status server-side', err);
    return false;
  }
}
