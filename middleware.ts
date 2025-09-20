/**
 * Next.js Middleware for THub V2
 * 
 * This middleware handles:
 * 1. Content Security Policy (CSP) for all routes
 * 2. Token-based authentication for protected routes
 * 3. Security headers for API routes
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateToken, extractToken } from '@/lib/auth/token-auth'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/signals',
  '/dashboard',
  '/api/signals',
  '/api/user'
]

// Routes that are public (landing page, auth)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/showcase',
  '/demo',
  '/api/webhooks/n8n',
  '/api/test-analysis'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // TEMPORARY: Disable CSP completely for MVP
  // TODO: Re-enable with proper configuration after MVP launch
  console.log('[Middleware] CSP disabled for MVP development')
  
  // Initialize response
  let response = NextResponse.next()
  
  // Security headers (non-CSP)
  const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  )

  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // Allow public routes
  if (isPublicRoute) {
    return response
  }

  // For protected routes, validate token
  if (isProtectedRoute) {
    const token = extractToken(request)
    
    if (!token) {
      // Redirect to login page for non-API routes
      if (!pathname.startsWith('/api/')) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
      
      // Return 401 for API routes
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Validate the token
    const authResult = await validateToken(token)
    
    if (!authResult.authenticated) {
      // Redirect to login page with error for non-API routes
      if (!pathname.startsWith('/api/')) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'invalid_token')
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
      
      // Return 401 for API routes
      return new Response(
        JSON.stringify({ 
          error: authResult.error,
          code: 'UNAUTHORIZED'
        }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Clone request headers and add user info for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', authResult.id)
    requestHeaders.set('x-user-name', authResult.name)
    requestHeaders.set('x-user-email', authResult.email)
    
    // Create new response with modified request headers
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    
    // CSP disabled for MVP - will be re-enabled with proper configuration post-launch
    
    // Set cookie for subsequent requests
    response.cookies.set('thub_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })
    
    return response
  }

  // Default: allow the request with CSP headers
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc)
     * 
     * Note: API routes ARE included for authentication and CSP headers
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}