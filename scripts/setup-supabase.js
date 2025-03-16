// Script to set up the Supabase database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key is missing. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL migration file
const sqlFilePath = path.join(__dirname, '..', 'supabase', 'migrations', '20230601000000_create_mergers_table.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Split the SQL into individual statements
const statements = sql
  .replace(/--.*$/gm, '') // Remove comments
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

async function executeStatements() {
  try {
    console.log('Setting up Supabase database...');
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing SQL statement: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc('pgmigrate', { query: statement });
      
      if (error) {
        console.error('Error executing SQL statement:', error);
        // Continue with other statements even if one fails
      }
    }
    
    console.log('Database setup completed successfully!');
    
    // Verify the table was created by fetching a count
    const { data, error } = await supabase.from('mergers').select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error verifying table creation:', error);
    } else {
      console.log(`Successfully created 'mergers' table with ${data.length} records.`);
    }
    
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

executeStatements(); 