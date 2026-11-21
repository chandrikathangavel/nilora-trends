import { NextResponse } from 'next/server';
import { testSupabaseConnection, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  try {
    const isConfigured = isSupabaseConfigured;
    const connTest = await testSupabaseConnection();

    return NextResponse.json({
      status: connTest.connected ? 'healthy' : isConfigured ? 'database_unreachable' : 'demo_mode',
      timestamp: new Date().toISOString(),
      supabase: {
        configured: isConfigured,
        connected: connTest.connected,
        message: connTest.message,
        categoriesCount: connTest.categoriesCount ?? 0,
        productsCount: connTest.productsCount ?? 0,
        tablesVerified: connTest.tablesVerified ?? [],
        error: connTest.error ?? null,
      },
      environment: {
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown health check failure';
    return NextResponse.json(
      {
        status: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
