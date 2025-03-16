require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

console.log(`Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSqlFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        // Use direct SQL query instead of pgmigrate RPC
        const { data, error } = await supabase.from('mergers').select('count(*)').limit(1).single();
        
        // If we can query the database, we can proceed with manual operations
        if (statement.toLowerCase().includes('create table') || statement.toLowerCase().includes('alter table')) {
          console.log(`Skipping DDL statement (must be executed in Supabase SQL Editor): ${statement.substring(0, 50)}...`);
        } else if (statement.toLowerCase().includes('insert into users')) {
          // Handle user insertion
          const matches = statement.match(/\('([^']+)', '([^']+)', '([^']+)'\)/g);
          if (matches) {
            for (const match of matches) {
              const values = match.match(/\('([^']+)', '([^']+)', '([^']+)'\)/);
              if (values && values.length === 4) {
                const name = values[1];
                const email = values[2];
                const avatarUrl = values[3];
                
                const { data, error } = await supabase
                  .from('users')
                  .upsert({ name, email, avatar_url: avatarUrl })
                  .select();
                
                if (error) {
                  console.error(`Error inserting user ${name}:`, error);
                } else {
                  console.log(`User ${name} inserted/updated successfully`);
                }
              }
            }
          }
        } else if (statement.toLowerCase().includes('update mergers')) {
          // Handle merger updates
          console.log('Updating mergers with has_phase_2 values...');
          
          // First get all mergers
          const { data: mergers, error: fetchError } = await supabase
            .from('mergers')
            .select('id, current_status');
          
          if (fetchError) {
            console.error('Error fetching mergers:', fetchError);
          } else if (mergers) {
            console.log(`Found ${mergers.length} mergers to update`);
            
            // Update each merger
            for (const merger of mergers) {
              const hasPhase2 = ['Phase 2', 'Remedies', 'Approved with Remedies', 'Blocked'].includes(merger.current_status);
              
              const { data, error: updateError } = await supabase
                .from('mergers')
                .update({ has_phase_2: hasPhase2 })
                .eq('id', merger.id)
                .select();
              
              if (updateError) {
                console.error(`Error updating merger ${merger.id}:`, updateError);
              } else {
                console.log(`Merger ${merger.id} updated with has_phase_2=${hasPhase2}`);
              }
            }
          }
        } else {
          console.log(`Skipping statement (must be executed in Supabase SQL Editor): ${statement.substring(0, 50)}...`);
        }
      } catch (err) {
        console.error(`Exception executing statement ${i + 1}:`, err);
      }
    }
    
    console.log('SQL execution completed');
    console.log('NOTE: DDL statements (CREATE TABLE, ALTER TABLE, etc.) must be executed in the Supabase SQL Editor.');
    console.log('Please copy those statements and run them directly in the Supabase dashboard.');
  } catch (error) {
    console.error('Error executing SQL file:', error);
  }
}

// Check if a file path was provided as an argument
const sqlFilePath = process.argv[2];
if (!sqlFilePath) {
  console.error('Please provide the path to the SQL file as an argument');
  console.error('Example: node scripts/execute-sql.js supabase/create-users.sql');
  process.exit(1);
}

const fullPath = path.resolve(process.cwd(), sqlFilePath);
if (!fs.existsSync(fullPath)) {
  console.error(`File not found: ${fullPath}`);
  process.exit(1);
}

executeSqlFile(fullPath); 