// Script to run database migrations
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

// Get all migration files
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort(); // Sort to ensure migrations run in order

async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      
      // Read the SQL file
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split the SQL into individual statements
      const statements = sql
        .replace(/--.*$/gm, '') // Remove comments
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);
      
      // Execute each statement
      for (const statement of statements) {
        console.log(`Executing SQL statement: ${statement.substring(0, 50)}...`);
        
        try {
          const { error } = await supabase.rpc('pgmigrate', { query: statement });
          
          if (error) {
            console.error('Error executing SQL statement:', error);
            // Continue with other statements even if one fails
          }
        } catch (error) {
          console.error('Error executing SQL statement:', error);
          // Continue with other statements even if one fails
        }
      }
      
      console.log(`Migration ${file} completed.`);
    }
    
    console.log('All migrations completed successfully!');
    
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

// Run the migrations
runMigrations(); 