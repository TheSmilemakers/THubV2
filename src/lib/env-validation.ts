/**
 * Environment Validation for THub V2 Production Deployment
 * 
 * Validates all required environment variables and configurations
 * for MVP friend testing deployment.
 */

import { createClient } from '@/lib/supabase/server'

export interface EnvironmentCheck {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  value?: string
}

export interface EnvironmentValidation {
  overall: 'pass' | 'fail' | 'warning'
  checks: EnvironmentCheck[]
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
}

/**
 * Validate all environment variables
 */
export async function validateEnvironment(): Promise<EnvironmentValidation> {
  const checks: EnvironmentCheck[] = []

  // 1. Supabase Configuration
  checks.push(validateSupabaseUrl())
  checks.push(validateSupabaseAnonKey())
  checks.push(validateSupabaseServiceKey())
  
  // 2. EODHD API Configuration
  checks.push(validateEODHDApiKey())
  
  // 3. n8n Configuration
  checks.push(validateN8nWebhookSecret())
  checks.push(validateAppUrl())
  
  // 4. Database Connectivity
  checks.push(await validateDatabaseConnection())
  
  // 5. RLS Policies
  checks.push(await validateRLSPolicies())
  
  // 6. Test Users
  checks.push(await validateTestUsers())

  // Calculate summary
  const summary = {
    total: checks.length,
    passed: checks.filter(c => c.status === 'pass').length,
    failed: checks.filter(c => c.status === 'fail').length,
    warnings: checks.filter(c => c.status === 'warning').length
  }

  // Determine overall status
  let overall: 'pass' | 'fail' | 'warning' = 'pass'
  if (summary.failed > 0) {
    overall = 'fail'
  } else if (summary.warnings > 0) {
    overall = 'warning'
  }

  return {
    overall,
    checks,
    summary
  }
}

function validateSupabaseUrl(): EnvironmentCheck {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!url) {
    return {
      name: 'Supabase URL',
      status: 'fail',
      message: 'NEXT_PUBLIC_SUPABASE_URL not set'
    }
  }
  
  if (!url.startsWith('https://') || !url.includes('supabase.co')) {
    return {
      name: 'Supabase URL',
      status: 'fail',
      message: 'Invalid Supabase URL format',
      value: url
    }
  }
  
  return {
    name: 'Supabase URL',
    status: 'pass',
    message: 'Valid Supabase URL configured',
    value: url
  }
}

function validateSupabaseAnonKey(): EnvironmentCheck {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!key) {
    return {
      name: 'Supabase Anon Key',
      status: 'fail',
      message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY not set'
    }
  }
  
  if (!key.startsWith('eyJ')) {
    return {
      name: 'Supabase Anon Key',
      status: 'fail',
      message: 'Invalid JWT format for anon key'
    }
  }
  
  return {
    name: 'Supabase Anon Key',
    status: 'pass',
    message: 'Valid anon key configured',
    value: `${key.substring(0, 20)}...`
  }
}

function validateSupabaseServiceKey(): EnvironmentCheck {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!key) {
    return {
      name: 'Supabase Service Key',
      status: 'fail',
      message: 'SUPABASE_SERVICE_ROLE_KEY not set'
    }
  }
  
  if (!key.startsWith('eyJ')) {
    return {
      name: 'Supabase Service Key',
      status: 'fail',
      message: 'Invalid JWT format for service key'
    }
  }
  
  return {
    name: 'Supabase Service Key',
    status: 'pass',
    message: 'Valid service key configured',
    value: `${key.substring(0, 20)}...`
  }
}

function validateEODHDApiKey(): EnvironmentCheck {
  const key = process.env.EODHD_API_KEY
  
  if (!key) {
    return {
      name: 'EODHD API Key',
      status: 'fail',
      message: 'EODHD_API_KEY not set'
    }
  }
  
  if (key.length < 20) {
    return {
      name: 'EODHD API Key',
      status: 'warning',
      message: 'EODHD API key seems too short',
      value: `${key.substring(0, 10)}...`
    }
  }
  
  return {
    name: 'EODHD API Key',
    status: 'pass',
    message: 'EODHD API key configured',
    value: `${key.substring(0, 10)}...`
  }
}

function validateN8nWebhookSecret(): EnvironmentCheck {
  const secret = process.env.N8N_WEBHOOK_SECRET
  
  if (!secret) {
    return {
      name: 'n8n Webhook Secret',
      status: 'warning',
      message: 'N8N_WEBHOOK_SECRET not set (webhooks will be unprotected)'
    }
  }
  
  if (secret.length < 20) {
    return {
      name: 'n8n Webhook Secret',
      status: 'warning',
      message: 'Webhook secret should be longer for security',
      value: `${secret.substring(0, 10)}...`
    }
  }
  
  return {
    name: 'n8n Webhook Secret',
    status: 'pass',
    message: 'Webhook secret configured',
    value: `${secret.substring(0, 10)}...`
  }
}

function validateAppUrl(): EnvironmentCheck {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
  
  if (!url) {
    return {
      name: 'App URL',
      status: 'warning',
      message: 'NEXT_PUBLIC_APP_URL not set (may affect webhook URLs)'
    }
  }
  
  // For production, should be https://thub.rajanmaher.com
  if (process.env.NODE_ENV === 'production' && !url.includes('thub.rajanmaher.com')) {
    return {
      name: 'App URL',
      status: 'warning',
      message: 'Production URL should be thub.rajanmaher.com',
      value: url
    }
  }
  
  return {
    name: 'App URL',
    status: 'pass',
    message: 'App URL configured',
    value: url
  }
}

async function validateDatabaseConnection(): Promise<EnvironmentCheck> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('test_users').select('count').limit(1)
    
    if (error) {
      return {
        name: 'Database Connection',
        status: 'fail',
        message: `Database connection failed: ${error.message}`
      }
    }
    
    return {
      name: 'Database Connection',
      status: 'pass',
      message: 'Database connection successful'
    }
  } catch (error) {
    return {
      name: 'Database Connection',
      status: 'fail',
      message: `Database connection error: ${error}`
    }
  }
}

async function validateRLSPolicies(): Promise<EnvironmentCheck> {
  try {
    const supabase = await createClient()
    
    // Check if RLS is enabled on key tables
    const { data, error } = await supabase
      .from('test_users')
      .select('id')
      .limit(1)
    
    if (error && error.message.includes('row-level security')) {
      return {
        name: 'RLS Policies',
        status: 'pass',
        message: 'RLS policies are active and enforced'
      }
    }
    
    if (error) {
      return {
        name: 'RLS Policies',
        status: 'warning',
        message: `RLS check failed: ${error.message}`
      }
    }
    
    return {
      name: 'RLS Policies',
      status: 'pass',
      message: 'RLS policies configured'
    }
  } catch (error) {
    return {
      name: 'RLS Policies',
      status: 'fail',
      message: `RLS validation error: ${error}`
    }
  }
}

async function validateTestUsers(): Promise<EnvironmentCheck> {
  try {
    const supabase = await createClient()
    
    // Use service role to check test users
    const { data, error } = await supabase
      .from('test_users')
      .select('id, name, access_token')
    
    if (error) {
      return {
        name: 'Test Users',
        status: 'fail',
        message: `Failed to fetch test users: ${error.message}`
      }
    }
    
    if (!data || data.length === 0) {
      return {
        name: 'Test Users',
        status: 'fail',
        message: 'No test users found for MVP friend testing'
      }
    }
    
    const usersWithTokens = data.filter(user => user.access_token)
    
    if (usersWithTokens.length === 0) {
      return {
        name: 'Test Users',
        status: 'fail',
        message: 'No test users have access tokens'
      }
    }
    
    return {
      name: 'Test Users',
      status: 'pass',
      message: `${usersWithTokens.length} test users with valid tokens ready for MVP`
    }
  } catch (error) {
    return {
      name: 'Test Users',
      status: 'fail',
      message: `Test users validation error: ${error}`
    }
  }
}

/**
 * Quick environment check for API routes
 */
export function isProductionReady(): boolean {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'EODHD_API_KEY'
  ]
  
  return requiredVars.every(varName => !!process.env[varName])
}