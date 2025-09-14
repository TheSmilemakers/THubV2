/**
 * Client-side Authentication Utilities for THub V2 MVP
 * 
 * Handles token authentication on the client side for friend testing.
 */

'use client'

import React from 'react'
import { createClient } from '@/lib/supabase/client'

export interface User {
  id: string
  name: string
  email: string
  access_token: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

/**
 * Get token from various sources on client side
 */
export function getTokenFromClient(): string | null {
  // Check URL parameters first (for shared links)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')
    
    if (tokenFromUrl) {
      // Store in localStorage for persistence
      localStorage.setItem('thub_access_token', tokenFromUrl)
      
      // Clean URL
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('token')
      window.history.replaceState({}, '', cleanUrl.toString())
      
      return tokenFromUrl
    }
    
    // Check localStorage
    const tokenFromStorage = localStorage.getItem('thub_access_token')
    if (tokenFromStorage) {
      return tokenFromStorage
    }
  }
  
  return null
}

/**
 * Validate token on client side
 */
export async function validateTokenClient(token: string): Promise<User | null> {
  if (!token) return null
  
  try {
    const supabase = createClient()
    
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
    
    if (error) {
      console.error('Token validation RPC error:', error)
      return null
    }
    
    // Check if data exists and user is authenticated
    if (!data || !data.authenticated) {
      console.error('Token validation failed:', data?.error || 'Authentication failed')
      return null
    }
    
    return {
      id: data.id!,
      name: data.name!,
      email: data.email!,
      access_token: token
    }
  } catch (error) {
    console.error('Client token validation error:', error)
    return null
  }
}

/**
 * Sign out user
 */
export function signOut(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('thub_access_token')
    
    // Clear any cookies
    document.cookie = 'thub_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    
    // Redirect to home
    window.location.href = '/'
  }
}

/**
 * Get current user from localStorage and validate
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = getTokenFromClient()
  if (!token) return null
  
  return validateTokenClient(token)
}

/**
 * Create authenticated Supabase client
 */
export async function createAuthenticatedClientSide(): Promise<ReturnType<typeof createClient> | null> {
  const token = getTokenFromClient()
  if (!token) return null
  
  const supabase = createClient()
  
  try {
    await supabase.rpc('set_current_token', { token_value: token })
    return supabase
  } catch (error) {
    console.error('Failed to create authenticated client:', error)
    return null
  }
}

/**
 * Higher-order component to protect client-side routes
 */
export function withClientAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const [authState, setAuthState] = React.useState<AuthState>({
      user: null,
      loading: true,
      error: null
    })
    
    React.useEffect(() => {
      async function checkAuth() {
        try {
          const user = await getCurrentUser()
          setAuthState({
            user,
            loading: false,
            error: user ? null : 'Authentication required'
          })
        } catch (error) {
          setAuthState({
            user: null,
            loading: false,
            error: 'Authentication failed'
          })
        }
      }
      
      checkAuth()
    }, [])
    
    if (authState.loading) {
      return React.createElement('div', null, 'Loading...')
    }
    
    if (!authState.user) {
      return React.createElement('div', null, 'Please authenticate to access this page.')
    }
    
    return React.createElement(WrappedComponent, props)
  }
}

/**
 * React hook for authentication state
 */
export function useAuth(): AuthState & { signOut: () => void } {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })
  
  React.useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser()
        setAuthState({
          user,
          loading: false,
          error: user ? null : 'Not authenticated'
        })
      } catch (error) {
        setAuthState({
          user: null,
          loading: false,
          error: 'Authentication failed'
        })
      }
    }
    
    checkAuth()
  }, [])
  
  return {
    ...authState,
    signOut: () => {
      signOut()
      setAuthState({
        user: null,
        loading: false,
        error: 'Signed out'
      })
    }
  }
}

/**
 * Utility to share access with friends
 */
export function generateShareableLink(baseUrl?: string): string | null {
  const token = getTokenFromClient()
  if (!token) return null
  
  const base = baseUrl || window.location.origin
  return `${base}?token=${token}`
}