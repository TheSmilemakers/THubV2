import { z, ZodError, ZodSchema } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validation result type
 */
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * Validation error format
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Format Zod errors into a consistent structure
 */
export function formatZodErrors(error: ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Validate data against a Zod schema
 */
export function validateData<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, errors: formatZodErrors(error) };
    }
    throw error;
  }
}

/**
 * Validate request body
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    return validateData(schema, body);
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'body', message: 'Invalid JSON body' }],
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  const searchParams = request.nextUrl.searchParams;
  const params: Record<string, any> = {};
  
  searchParams.forEach((value, key) => {
    // Handle array parameters (e.g., ?symbols=AAPL&symbols=GOOGL)
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  });
  
  return validateData(schema, params);
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  errors: ValidationError[],
  message = 'Validation failed'
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      details: errors,
    },
    { status: 400 }
  );
}

/**
 * Middleware to validate request body
 */
export function withBodyValidation<T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, data: T) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = await validateRequestBody(request, schema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }
    
    return handler(request, validation.data);
  };
}

/**
 * Middleware to validate query parameters
 */
export function withQueryValidation<T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, params: T) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = validateQueryParams(request, schema);
    
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }
    
    return handler(request, validation.data);
  };
}

/**
 * Combined middleware for body and query validation
 */
export function withValidation<B, Q>(
  bodySchema: ZodSchema<B> | null,
  querySchema: ZodSchema<Q> | null,
  handler: (request: NextRequest, body: B | null, query: Q | null) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    let body: B | null = null;
    let query: Q | null = null;
    
    // Validate body if schema provided
    if (bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const bodyValidation = await validateRequestBody(request, bodySchema);
      if (!bodyValidation.success) {
        return validationErrorResponse(bodyValidation.errors, 'Invalid request body');
      }
      body = bodyValidation.data;
    }
    
    // Validate query if schema provided
    if (querySchema) {
      const queryValidation = validateQueryParams(request, querySchema);
      if (!queryValidation.success) {
        return validationErrorResponse(queryValidation.errors, 'Invalid query parameters');
      }
      query = queryValidation.data;
    }
    
    return handler(request, body, query);
  };
}

/**
 * Safe parse with default value
 */
export function safeParseWithDefault<T>(
  schema: ZodSchema<T>,
  data: unknown,
  defaultValue: T
): T {
  const result = schema.safeParse(data);
  return result.success ? result.data : defaultValue;
}

/**
 * Validate environment variables
 */
export function validateEnvVar(
  name: string,
  schema: ZodSchema,
  required = true
): string | undefined {
  const value = process.env[name];
  
  if (!value && required) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  if (value) {
    try {
      schema.parse(value);
      return value;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(
          `Invalid environment variable ${name}: ${error.errors[0].message}`
        );
      }
      throw error;
    }
  }
  
  return undefined;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi;
  
  return html.replace(tagRegex, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      return match;
    }
    return '';
  });
}

/**
 * Rate limit key generator
 */
export function getRateLimitKey(
  identifier: string,
  action: string,
  window: number
): string {
  const windowStart = Math.floor(Date.now() / 1000 / window) * window;
  return `rate_limit:${identifier}:${action}:${windowStart}`;
}