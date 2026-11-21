import { createBrowserClient, createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-nilora-project.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'demo-anon-key-placeholder';

/**
 * Creates a browser-side Supabase client with secure cookie-based session persistence.
 */
export function createClientComponentClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Creates a server-side Supabase client for Server Components and Route Handlers.
 * Securely reads and writes authentication session cookies.
 */
export async function createServerComponentClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
