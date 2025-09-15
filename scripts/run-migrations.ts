#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');
  
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
  
  try {
    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/001_initial_schema.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Executing migration: 001_initial_schema.sql');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If RPC doesn't exist, try direct execution (for testing)
      console.log('⚠️  exec_sql RPC not found, please run migration manually in Supabase SQL editor');
      console.log('\n📋 Migration SQL saved to: supabase/migrations/001_initial_schema.sql');
      console.log('\n📝 Instructions:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of the migration file');
      console.log('4. Run the query');
      return;
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Test the schema
    console.log('\n🧪 Testing database schema...');
    
    const { data: signals, error: signalsError } = await supabase
      .from('signals')
      .select('*')
      .limit(1);
      
    if (signalsError) {
      console.error('❌ Error testing signals table:', signalsError);
    } else {
      console.log('✅ Signals table is accessible');
    }
    
    const { data: cache, error: cacheError } = await supabase
      .from('indicator_cache')
      .select('*')
      .limit(1);
      
    if (cacheError) {
      console.error('❌ Error testing indicator_cache table:', cacheError);
    } else {
      console.log('✅ Indicator cache table is accessible');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations().catch(console.error);