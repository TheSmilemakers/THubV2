import { z } from 'zod';

const envSchema = z.object({
  // Public environment variables (available in browser)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  
  // Server-only environment variables
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  EODHD_API_KEY: z.string().min(1).optional(),
  N8N_WEBHOOK_SECRET: z.string().min(1).optional(),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const { fieldErrors } = error.flatten();
      const errorMessage = Object.entries(fieldErrors)
        .map(([field, errors]) => 
          errors ? `${field}: ${errors.join(', ')}` : field
        )
        .join('\n  ');
      
      throw new Error(
        `Missing or invalid environment variables:\n  ${errorMessage}`
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment variable access
export type Env = z.infer<typeof envSchema>;