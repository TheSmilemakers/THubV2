import { NextResponse } from 'next/server';

export async function GET() {
  // Only enable in non-production or for debugging
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Security check - you may want to add additional auth here
  if (!isDevelopment && process.env.VERCEL_ENV === 'production') {
    // In production, only show limited info
    return NextResponse.json({
      message: 'Environment check',
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseConfig: !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL && 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      hasEODHD: !!process.env.EODHD_API_KEY,
      hasWebhookSecret: !!process.env.N8N_WEBHOOK_SECRET,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
      timestamp: new Date().toISOString()
    });
  }

  // More detailed info for development
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    hasEODHD: !!process.env.EODHD_API_KEY,
    hasWebhookSecret: !!process.env.N8N_WEBHOOK_SECRET,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    vercelUrl: process.env.VERCEL_URL,
    timestamp: new Date().toISOString()
  });
}