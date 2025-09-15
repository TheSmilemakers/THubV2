import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Generate Content Security Policy header
 */
function generateCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "'sha256-whC4o9nB0MFB2J+a6xhfcVT/63FwibBEL61akKOGl+w='", // Hash for theme script
      isDev && "'unsafe-eval'", // Required for Next.js dev mode
      'https://cdn.jsdelivr.net', // For any CDN scripts
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for inline styles
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.githubusercontent.com',
      'https://*.googleusercontent.com',
      'https://avatars.supabase.co',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      'https://eodhistoricaldata.com',
      'wss://*.supabase.co',
      isDev && 'ws://localhost:*',
    ].filter(Boolean),
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'child-src': ["'none'"],
    'frame-src': ["'none'"],
    'worker-src': ["'self'", 'blob:'],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"],
    'upgrade-insecure-requests': !isDev ? [''] : undefined,
  };

  return Object.entries(directives)
    .filter(([_, values]) => values !== undefined)
    .map(([key, values]) => `${key} ${Array.isArray(values) ? values.join(' ') : values}`)
    .join('; ');
}

/**
 * Apply Content Security Policy to response
 */
export function applyCSPMiddleware(request: NextRequest, response: NextResponse): NextResponse {
  // Generate nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // Set CSP header
  const cspHeader = generateCSP(nonce);
  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Add nonce to request headers for use in app
  response.headers.set('x-nonce', nonce);
  
  return response;
}