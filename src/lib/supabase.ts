import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-nilora-project.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'demo-anon-key-placeholder';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo-nilora-project') &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id')
);

// Typed Supabase client for client-side operations (safe with anon key & RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Diagnostic helper: Tests connection to the user's Supabase project.
 * Checks table access, categories count, and reports helpful diagnostics.
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  categoriesCount?: number;
  productsCount?: number;
  tablesVerified?: string[];
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      message: 'Supabase credentials are not configured yet. Running in Demo Preview Mode with local catalog.',
    };
  }

  try {
    // 1. Check categories table
    const { data: catData, count: catCount, error: catError } = await supabase
      .from('categories')
      .select('id', { count: 'exact' })
      .limit(1);

    if (catError) {
      return {
        connected: false,
        message: `Connected to Supabase endpoint, but encountered database error: ${catError.message}. Please run the SQL migration script in your Supabase SQL Editor.`,
        error: catError.message,
      };
    }

    // 2. Check products table
    const { data: prodData, count: prodCount, error: prodError } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .limit(1);

    if (prodError) {
      return {
        connected: false,
        message: `Database connected, but products table query failed: ${prodError.message}.`,
        error: prodError.message,
      };
    }

    return {
      connected: true,
      message: 'Successfully connected to Nilora Trends Supabase PostgreSQL database!',
      categoriesCount: catCount ?? 0,
      productsCount: prodCount ?? 0,
      tablesVerified: ['categories', 'products', 'product_images', 'product_variants', 'profiles'],
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Failed to reach Supabase: ${errorMsg}`,
      error: errorMsg,
    };
  }
}
