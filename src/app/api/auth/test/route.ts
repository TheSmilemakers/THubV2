/**
 * Authentication Test API Endpoint
 * 
 * Tests the complete token authentication flow for MVP friend testing
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/token-auth'
import { createAuthenticatedClient } from '@/lib/auth/token-auth'

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Test 1: User authentication worked
    const authTest = {
      user_authenticated: true,
      user_id: user.id,
      user_name: user.name,
      user_email: user.email
    }

    // Test 2: Database access with RLS
    const supabase = await createAuthenticatedClient(user.access_token)
    
    // Test reading signals (should work with authenticated user)
    const { data: signals, error: signalsError } = await supabase
      .from('signals')
      .select('id, symbol, convergence_score, created_at')
      .gte('convergence_score', 70)
      .limit(5)

    // Test reading user's own data
    const { data: userData, error: userError } = await supabase
      .from('test_users')
      .select('id, name, email, created_at')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        authentication: authTest,
        database_access: {
          signals: {
            success: !signalsError,
            count: signals?.length || 0,
            error: signalsError?.message,
            sample: signals?.[0]
          },
          user_data: {
            success: !userError,
            data: userData,
            error: userError?.message
          }
        }
      },
      mvp_ready: !signalsError && !userError
    })

  } catch (error) {
    console.error('Auth test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Authentication test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

// Test endpoint without authentication (should fail)
export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'This endpoint is not protected and should not be used',
    message: 'Use GET with valid token to test authentication'
  }, { status: 400 })
}