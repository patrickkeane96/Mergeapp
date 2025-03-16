// Script to create the mergers table in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key is missing. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL to create the mergers table
const createTableSQL = `
CREATE TABLE IF NOT EXISTS mergers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  acquirer TEXT NOT NULL,
  target TEXT NOT NULL,
  industry TEXT NOT NULL,
  filing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  current_status TEXT NOT NULL,
  status_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  is_followed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mergers_industry ON mergers(industry);
CREATE INDEX IF NOT EXISTS idx_mergers_filing_date ON mergers(filing_date);
CREATE INDEX IF NOT EXISTS idx_mergers_is_followed ON mergers(is_followed);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mergers_updated_at ON mergers;
CREATE TRIGGER update_mergers_updated_at
BEFORE UPDATE ON mergers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
`;

async function createTable() {
  try {
    console.log('Creating the mergers table in Supabase...');

    // Execute the SQL to create the table
    const { error } = await supabase.rpc('exec', { query: createTableSQL });
    
    if (error) {
      console.error('Error creating table:', error);
      
      // If the 'exec' RPC function doesn't exist, we need to use the SQL editor in the Supabase dashboard
      console.log('\nIt seems the "exec" RPC function is not available in your Supabase project.');
      console.log('Please follow these steps to create the table manually:');
      console.log('1. Go to the Supabase dashboard at https://app.supabase.com/');
      console.log('2. Select your project');
      console.log('3. Go to the SQL Editor');
      console.log('4. Create a new query');
      console.log('5. Copy and paste the SQL from the "supabase-setup.sql" file');
      console.log('6. Run the query');
      
      return;
    }

    console.log('Successfully created the mergers table!');
    
    // Verify the table was created
    const { data, error: verifyError } = await supabase
      .from('mergers')
      .select('*', { count: 'exact', head: true });
    
    if (verifyError) {
      console.error('Error verifying table creation:', verifyError);
      return;
    }
    
    console.log('Table verification successful!');
    console.log('You can now run the "insert-sample-data.js" script to populate the table with sample data.');
  } catch (error) {
    console.error('Error creating table:', error);
  }
}

createTable(); 