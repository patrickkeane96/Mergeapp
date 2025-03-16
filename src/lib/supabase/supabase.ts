import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase is properly configured
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('mergers').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return { available: false, reason: error.message };
    }
    
    return { available: true };
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return { available: false, reason: 'Error checking connection' };
  }
} 