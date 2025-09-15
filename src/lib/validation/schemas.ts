import { z } from 'zod';

/**
 * Common validation schemas used across the application
 */

// Email validation with additional security checks
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .trim()
  .max(255, 'Email too long')
  .refine(
    (email) => !email.includes('..') && !email.startsWith('.') && !email.endsWith('.'),
    'Invalid email format'
  );

// Strong password requirements
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  );

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  orderBy: z.enum(['created_at', 'updated_at', 'score']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Date range validation
const dateRangeBase = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const dateRangeSchema = dateRangeBase.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: 'Start date must be before end date' }
);

// Stock symbol validation
export const stockSymbolSchema = z
  .string()
  .toUpperCase()
  .trim()
  .min(1, 'Symbol required')
  .max(10, 'Symbol too long')
  .regex(/^[A-Z0-9.-]+$/, 'Invalid symbol format');

// Webhook payload validation
export const webhookPayloadSchema = z.object({
  secret: z.string().min(32, 'Invalid webhook secret'),
  event: z.string(),
  data: z.unknown(),
  timestamp: z.number().optional(),
});

// Signal filters validation
export const signalFiltersSchema = z.object({
  symbols: z.array(stockSymbolSchema).optional(),
  minScore: z.coerce
    .number()
    .min(0)
    .max(100)
    .optional(),
  maxScore: z.coerce
    .number()
    .min(0)
    .max(100)
    .optional(),
  signalTypes: z.array(z.enum(['buy', 'sell', 'hold'])).optional(),
  sectors: z.array(z.string()).optional(),
  ...paginationSchema.shape,
  ...dateRangeBase.shape,
}).refine(
  (data) => {
    if (data.minScore && data.maxScore) {
      return data.minScore <= data.maxScore;
    }
    return true;
  },
  { message: 'Min score must be less than max score' }
);

// User preferences validation
export const userPreferencesSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(false),
    sms: z.boolean().default(false),
  }).optional(),
  trading: z.object({
    defaultOrderType: z.enum(['market', 'limit', 'stop']).default('market'),
    riskLevel: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
    autoTrade: z.boolean().default(false),
  }).optional(),
  display: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('dark'),
    currency: z.string().default('USD'),
    timezone: z.string().default('America/New_York'),
    language: z.enum(['en', 'es', 'fr', 'de', 'ja', 'zh']).default('en'),
  }).optional(),
});

// API rate limit validation
export const rateLimitSchema = z.object({
  identifier: z.string(),
  action: z.string(),
  limit: z.number().int().positive(),
  window: z.number().int().positive(), // in seconds
});

// Authentication schemas
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .trim()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid name format'),
  invitationCode: z.string().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required'),
  rememberMe: z.boolean().default(false),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Profile update validation
export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .optional(),
  username: z
    .string()
    .trim()
    .min(3, 'Username too short')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, _ and -')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio too long')
    .optional(),
  avatarUrl: z
    .string()
    .url('Invalid avatar URL')
    .optional(),
  preferences: userPreferencesSchema.optional(),
});

// Market data request validation
export const marketDataRequestSchema = z.object({
  symbols: z.array(stockSymbolSchema).min(1, 'At least one symbol required'),
  interval: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1mo']).default('1d'),
  ...dateRangeBase.shape,
});

// Trade order validation
export const tradeOrderSchema = z.object({
  symbol: stockSymbolSchema,
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit', 'stop', 'stop_limit']),
  quantity: z
    .number()
    .positive('Quantity must be positive')
    .max(1000000, 'Quantity too large'),
  price: z
    .number()
    .positive('Price must be positive')
    .optional(),
  stopPrice: z
    .number()
    .positive('Stop price must be positive')
    .optional(),
}).refine(
  (data) => {
    if (data.type === 'limit' || data.type === 'stop_limit') {
      return data.price !== undefined;
    }
    return true;
  },
  { message: 'Price required for limit orders' }
).refine(
  (data) => {
    if (data.type === 'stop' || data.type === 'stop_limit') {
      return data.stopPrice !== undefined;
    }
    return true;
  },
  { message: 'Stop price required for stop orders' }
);

// Watchlist validation
export const watchlistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name required')
    .max(50, 'Name too long'),
  description: z
    .string()
    .max(200, 'Description too long')
    .optional(),
  symbols: z
    .array(stockSymbolSchema)
    .max(100, 'Too many symbols'),
  isPublic: z.boolean().default(false),
});

// Alert validation
export const alertSchema = z.object({
  symbol: stockSymbolSchema,
  type: z.enum(['price_above', 'price_below', 'volume_spike', 'signal_generated']),
  threshold: z.number().positive('Threshold must be positive'),
  enabled: z.boolean().default(true),
  notificationChannels: z.array(z.enum(['email', 'push', 'sms'])).default(['email']),
});

// Export all schemas as a namespace for easy importing
export const ValidationSchemas = {
  email: emailSchema,
  password: passwordSchema,
  uuid: uuidSchema,
  pagination: paginationSchema,
  dateRange: dateRangeSchema,
  stockSymbol: stockSymbolSchema,
  webhookPayload: webhookPayloadSchema,
  signalFilters: signalFiltersSchema,
  userPreferences: userPreferencesSchema,
  rateLimit: rateLimitSchema,
  signUp: signUpSchema,
  signIn: signInSchema,
  passwordResetRequest: passwordResetRequestSchema,
  passwordReset: passwordResetSchema,
  profileUpdate: profileUpdateSchema,
  marketDataRequest: marketDataRequestSchema,
  tradeOrder: tradeOrderSchema,
  watchlist: watchlistSchema,
  alert: alertSchema,
};

// Type exports
export type EmailSchema = z.infer<typeof emailSchema>;
export type PasswordSchema = z.infer<typeof passwordSchema>;
export type PaginationSchema = z.infer<typeof paginationSchema>;
export type DateRangeSchema = z.infer<typeof dateRangeSchema>;
export type StockSymbolSchema = z.infer<typeof stockSymbolSchema>;
export type WebhookPayloadSchema = z.infer<typeof webhookPayloadSchema>;
export type SignalFiltersSchema = z.infer<typeof signalFiltersSchema>;
export type UserPreferencesSchema = z.infer<typeof userPreferencesSchema>;
export type RateLimitSchema = z.infer<typeof rateLimitSchema>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
export type SignInSchema = z.infer<typeof signInSchema>;
export type ProfileUpdateSchema = z.infer<typeof profileUpdateSchema>;
export type MarketDataRequestSchema = z.infer<typeof marketDataRequestSchema>;
export type TradeOrderSchema = z.infer<typeof tradeOrderSchema>;
export type WatchlistSchema = z.infer<typeof watchlistSchema>;
export type AlertSchema = z.infer<typeof alertSchema>;