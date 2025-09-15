import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applyCSPMiddleware } from './middleware-csp';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  // Apply Content Security Policy
  response = applyCSPMiddleware(request, response);

  // Add additional security headers for specific routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // API-specific headers
    response.headers.set('X-API-Version', '1.0');
    
    // Prevent caching of API responses by default
    if (!response.headers.has('Cache-Control')) {
      response.headers.set('Cache-Control', 'no-store, max-age=0');
    }
  }

  // CORS headers for API routes (if needed for specific origins)
  if (request.nextUrl.pathname.startsWith('/api/public/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};