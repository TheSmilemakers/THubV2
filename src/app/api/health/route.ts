/**
 * Health Check API Endpoint for THub V2
 * 
 * Provides comprehensive environment validation and system health status
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateEnvironment, isProductionReady } from '@/lib/env-validation'

export async function GET(request: NextRequest) {
  try {
    // Quick check for basic functionality
    const basicReady = isProductionReady()
    
    // Get query parameter for detailed check
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'
    
    if (!detailed) {
      // Quick health check
      return NextResponse.json({
        status: basicReady ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: 'THub V2 MVP',
        environment: process.env.NODE_ENV || 'development',
        ready: basicReady
      })
    }
    
    // Detailed environment validation
    const validation = await validateEnvironment()
    
    return NextResponse.json({
      status: validation.overall === 'pass' ? 'healthy' : 
              validation.overall === 'warning' ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: 'THub V2 MVP',
      environment: process.env.NODE_ENV || 'development',
      validation,
      recommendations: generateRecommendations(validation)
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateRecommendations(validation: any): string[] {
  const recommendations: string[] = []
  
  validation.checks.forEach((check: any) => {
    if (check.status === 'fail') {
      switch (check.name) {
        case 'Database Connection':
          recommendations.push('Check Supabase project status and network connectivity')
          break
        case 'Test Users':
          recommendations.push('Run database migration to create test users with access tokens')
          break
        case 'Supabase URL':
        case 'Supabase Anon Key':
        case 'Supabase Service Key':
          recommendations.push('Verify Supabase environment variables in deployment settings')
          break
        case 'EODHD API Key':
          recommendations.push('Set EODHD_API_KEY in environment variables')
          break
      }
    } else if (check.status === 'warning') {
      switch (check.name) {
        case 'n8n Webhook Secret':
          recommendations.push('Set N8N_WEBHOOK_SECRET for webhook security')
          break
        case 'App URL':
          recommendations.push('Set NEXT_PUBLIC_APP_URL to production domain')
          break
      }
    }
  })
  
  // MVP-specific recommendations
  if (validation.overall !== 'pass') {
    recommendations.push('Complete Session A security setup before proceeding to UI implementation')
  }
  
  if (validation.summary.failed === 0 && validation.summary.warnings > 0) {
    recommendations.push('System ready for MVP deployment with minor optimizations needed')
  }
  
  return recommendations
}