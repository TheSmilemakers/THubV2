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
import { randomUUID } from 'crypto'

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
  '/api/webhooks/n8n',
  '/api/test-analysis'
]

/**
 * Generate Content Security Policy header
 */
function generateCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
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
  }

  return Object.entries(directives)
    .filter(([_, values]) => values !== undefined)
    .map(([key, values]) => `${key} ${Array.isArray(values) ? values.join(' ') : values}`)
    .join('; ')
}

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

  // Generate nonce for CSP
  const nonce = Buffer.from(randomUUID()).toString('base64')
  
  // Initialize response with CSP headers
  let response = NextResponse.next()
  
  // Apply CSP to all responses
  const cspHeader = generateCSP(nonce)
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('x-nonce', nonce)

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
      // Redirect to landing page with error for non-API routes
      if (!pathname.startsWith('/api/')) {
        const loginUrl = new URL('/', request.url)
        loginUrl.searchParams.set('error', 'authentication_required')
        const redirectResponse = NextResponse.redirect(loginUrl)
        // Preserve CSP headers
        redirectResponse.headers.set('Content-Security-Policy', cspHeader)
        redirectResponse.headers.set('x-nonce', nonce)
        return redirectResponse
      }
      
      // Return 401 for API routes
      const errorResponse = new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Content-Security-Policy': cspHeader,
            'x-nonce': nonce
          }
        }
      )
      return errorResponse
    }

    // Validate the token
    const authResult = await validateToken(token)
    
    if (!authResult.authenticated) {
      // Redirect to landing page with error for non-API routes
      if (!pathname.startsWith('/api/')) {
        const loginUrl = new URL('/', request.url)
        loginUrl.searchParams.set('error', 'invalid_token')
        const redirectResponse = NextResponse.redirect(loginUrl)
        // Preserve CSP headers
        redirectResponse.headers.set('Content-Security-Policy', cspHeader)
        redirectResponse.headers.set('x-nonce', nonce)
        return redirectResponse
      }
      
      // Return 401 for API routes
      const errorResponse = new Response(
        JSON.stringify({ 
          error: authResult.error,
          code: 'UNAUTHORIZED'
        }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Content-Security-Policy': cspHeader,
            'x-nonce': nonce
          }
        }
      )
      return errorResponse
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
    
    // Apply CSP headers to the response
    response.headers.set('Content-Security-Policy', cspHeader)
    response.headers.set('x-nonce', nonce)
    
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}