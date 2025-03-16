// Simple script to insert data into the mergers table
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

// Insert a single test record
async function insertTestRecord() {
  try {
    console.log('Inserting a test record into the mergers table...');

    const testRecord = {
      name: 'Test Merger',
      acquirer: 'Company A',
      target: 'Company B',
      industry: 'Technology',
      filing_date: new Date().toISOString(),
      current_status: 'Phase 1',
      description: 'This is a test merger record'
    };

    const { data, error } = await supabase
      .from('mergers')
      .insert(testRecord)
      .select();
    
    if (error) {
      console.error('Error inserting test record:', error);
      return;
    }

    console.log('Successfully inserted test record:', data);
    
    // Verify the data
    const { data: allData, error: fetchError } = await supabase
      .from('mergers')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching data:', fetchError);
      return;
    }

    console.log(`Total records in the 'mergers' table: ${allData.length}`);
  } catch (error) {
    console.error('Error inserting test record:', error);
  }
}

insertTestRecord(); 