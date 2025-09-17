# Authentication Token Fix - 2025-09-14

## Issue
Client-side token validation was failing with "No token provided" error because the RPC functions `set_current_token` and `get_current_user` relied on PostgreSQL session settings that don't persist between RPC calls in Supabase.

## Solution
Created a new RPC function `validate_token_and_get_user` that accepts the token as a parameter and returns user data in a single call.

### Migration Added
`005_fix_token_validation.sql` - Creates the new validation function

### Code Updated
1. `src/lib/auth/client-auth.ts` - Updated to use new RPC function
2. `src/lib/auth/token-auth.ts` - Updated for consistency

### Test Tokens
For development testing, use these tokens:
- `9edf8e84-6266-46ee-aa77-e4e3651e3923` - Rajan Maher (rajan.maher@gmail.com)
- `304c8d9a-43e5-4c81-91cb-c40eb3822de4` - Jins Mehta (jins.mehta@gmail.com)
- `74d0c658-7b21-4687-8a2f-abb6a0c838dd` - Mayur Jethwa (mayurjethwa@gmail.com)

## How to Apply

1. **Apply the migration to your Supabase project:**
   ```bash
   npx supabase db push
   ```

2. **Seed test users (development only):**
   ```bash
   npx supabase db seed
   ```

3. **Test authentication:**
   - Go to http://localhost:3001/login
   - Enter one of the test tokens
   - You should be redirected to the dashboard

## Note
The new function is more reliable as it doesn't depend on session settings and works correctly in both server and client contexts.