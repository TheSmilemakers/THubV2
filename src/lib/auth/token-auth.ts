/**
 * Token-based Authentication System for THub V2 MVP Friend Testing
 * 
 * This system uses access tokens stored in the test_users table for MVP authentication
 * instead of full Supabase Auth to enable rapid friend testing deployment.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  access_token: string
  authenticated: true
}

export interface AuthError {
  error: string
  authenticated: false
}

export type AuthResult = AuthenticatedUser | AuthError

/**
 * Extract token from various sources (header, query param, cookie)
 */
export function extractToken(request: NextRequest): string | null {
  // Priority order: Authorization header > Query param > Cookie
  
  // 1. Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 2. Check query parameter 
  const tokenFromQuery = request.nextUrl.searchParams.get('token')
  if (tokenFromQuery) {
    return tokenFromQuery
  }

  // 3. Check cookie
  const tokenFromCookie = request.cookies.get('thub_access_token')?.value
  if (tokenFromCookie) {
    return tokenFromCookie
  }

  return null
}

/**
 * Validate token and return user information
 */
export async function validateToken(token: string): Promise<AuthResult> {
  if (!token) {
    return { error: 'No token provided', authenticated: false }
  }

  try {
    const supabase = await createClient()
    
    // Use the new combined validation function
    const { data, error } = await supabase
      .rpc('validate_token_and_get_user', { token_value: token })
      .single<{
        authenticated: boolean
        id: string | null
        name: string | null
        email: string | null
        error: string | null
      }>()
    
    if (error || !data) {
      return { error: 'Invalid token', authenticated: false }
    }

    if (!data.authenticated) {
      return { error: data.error || 'Invalid token', authenticated: false }
    }

    return {
      id: data.id!,
      name: data.name!,
      email: data.email!,
      access_token: token,
      authenticated: true
    }
  } catch (error) {
    console.error('Token validation error:', error)
    return { error: 'Authentication failed', authenticated: false }
  }
}

/**
 * Authenticate request and return user or error
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const token = extractToken(request)
  if (!token) {
    return { error: 'No authentication token found', authenticated: false }
  }

  return validateToken(token)
}

/**
 * Create a supabase client with token authentication
 */
export async function createAuthenticatedClient(token: string) {
  const supabase = await createClient()
  
  // Set the token for this session
  await supabase.rpc('set_current_token', { token_value: token })
  
  return supabase
}

/**
 * Higher-order function to protect API routes
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: any[]) => Promise<Response>
) {
  return async (request: NextRequest, ...args: any[]): Promise<Response> => {
    const authResult = await authenticateRequest(request)
    
    if (!authResult.authenticated) {
      return new Response(
        JSON.stringify({ 
          error: authResult.error,
          code: 'UNAUTHORIZED' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    try {
      return await handler(request, authResult, ...args)
    } catch (error) {
      console.error('API route error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          code: 'INTERNAL_ERROR' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

/**
 * Utility to check if user has access to specific features
 */
export function hasAccess(user: AuthenticatedUser, feature: string): boolean {
  // For MVP, all authenticated users have access to all features
  // This can be extended later with role-based permissions
  return user.authenticated
}

/**
 * Generate a shareable access URL for friend testing
 */
export function generateAccessUrl(token: string, baseUrl: string = 'https://thub.rajanmaher.com'): string {
  return `${baseUrl}?token=${token}`
}

/**
 * Utility to log user activity for analytics
 */
export async function logUserActivity(
  user: AuthenticatedUser, 
  action: string, 
  metadata?: Record<string, any>
) {
  try {
    const supabase = await createAuthenticatedClient(user.access_token)
    
    // This would log to an activity table if we had one
    // For now, just console log for debugging
    console.log('User Activity:', {
      userId: user.id,
      userName: user.name,
      action,
      timestamp: new Date().toISOString(),
      metadata
    })
  } catch (error) {
    console.error('Failed to log user activity:', error)
  }
}