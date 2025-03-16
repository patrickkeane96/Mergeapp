// Script to test the connection to Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key is missing. Please check your .env.local file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing connection to Supabase...');
    
    // Try to get the server version
    const { data, error } = await supabase.rpc('get_server_version');
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      
      // Try a simpler query
      console.log('Trying a simpler query...');
      const { data: tableData, error: tableError } = await supabase
        .from('mergers')
        .select('count', { count: 'exact', head: true });
      
      if (tableError) {
        if (tableError.code === '42P01') {
          console.log('The mergers table does not exist yet. You need to create it using the SQL script.');
        } else {
          console.error('Error querying the mergers table:', tableError);
        }
      } else {
        console.log('Successfully connected to Supabase!');
        console.log('Mergers table exists with count:', tableData);
      }
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Server version:', data);
      
      // Check if the mergers table exists
      const { data: tableData, error: tableError } = await supabase
        .from('mergers')
        .select('count', { count: 'exact', head: true });
      
      if (tableError) {
        if (tableError.code === '42P01') {
          console.log('The mergers table does not exist yet. You need to create it using the SQL script.');
        } else {
          console.error('Error querying the mergers table:', tableError);
        }
      } else {
        console.log('Mergers table exists with count:', tableData);
      }
    }
  } catch (error) {
    console.error('Error testing connection:', error);
  }
}

testConnection(); 