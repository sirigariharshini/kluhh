// backend/config/supabase.ts
// Supabase client initialization and configuration

import { createClient } from '@supabase/supabase-js';
import { config } from './env';

// Backend service role key for admin operations
export const supabaseAdmin = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_KEY
);

// Create a client for user-specific operations (with auth)
export const createSupabaseClient = (accessToken?: string) => {
  return createClient(
    config.SUPABASE_URL,
    config.SUPABASE_KEY,
    {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    }
  );
};

export const supabase = supabaseAdmin;

// Test connection
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      return false;
    }

    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}
