require('dotenv').config({ path: '.env.local' });
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

// Sample users to insert
const sampleUsers = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
  },
  {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
  },
  {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  }
];

async function createUsersTable() {
  try {
    console.log('Attempting to create users table...');
    
    // Try to query the users table to see if it exists
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === '42P01') { // relation does not exist
        console.log('Users table does not exist. Creating it...');
        
        // We'll use a direct REST API call to create the table
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              query: `
                CREATE TABLE IF NOT EXISTS users (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  name TEXT NOT NULL,
                  email TEXT UNIQUE NOT NULL,
                  avatar_url TEXT,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                  NEW.updated_at = NOW();
                  RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                
                DROP TRIGGER IF EXISTS update_users_updated_at ON users;
                CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
              `
            })
          });
          
          if (!response.ok) {
            console.log('Could not create table via REST API. This is expected - please create the table manually in the Supabase SQL Editor.');
            console.log('Please run the SQL in supabase/create-users.sql in the Supabase SQL Editor.');
          } else {
            console.log('Users table created successfully.');
          }
        } catch (err) {
          console.log('Error creating table:', err.message);
          console.log('Please create the table manually in the Supabase SQL Editor.');
          console.log('Please run the SQL in supabase/create-users.sql in the Supabase SQL Editor.');
        }
      } else {
        console.error('Error checking if users table exists:', error);
      }
    } else {
      console.log('Users table already exists.');
    }
    
    // Insert sample users
    console.log('Inserting sample users...');
    let successCount = 0;
    
    for (const user of sampleUsers) {
      try {
        const { data, error } = await supabase
          .from('users')
          .upsert(user)
          .select();
        
        if (error) {
          console.error(`Error inserting user ${user.name}:`, error);
        } else {
          console.log(`User ${user.name} inserted/updated successfully.`);
          successCount++;
        }
      } catch (err) {
        console.error(`Exception inserting user ${user.name}:`, err);
      }
    }
    
    console.log(`User insertion completed. ${successCount} out of ${sampleUsers.length} users inserted/updated successfully.`);
    
    // Verify users in the table
    try {
      const { data: users, error: verifyError } = await supabase
        .from('users')
        .select('*');
      
      if (verifyError) {
        console.error('Error verifying users:', verifyError);
      } else if (users) {
        console.log(`\nTotal users in the table: ${users.length}`);
        console.log('Users:');
        users.forEach(user => {
          console.log(`  - ${user.name} (${user.email})`);
        });
      }
    } catch (err) {
      console.error('Exception verifying users:', err);
    }
  } catch (error) {
    console.error('Error in createUsersTable:', error);
  }
}

createUsersTable(); 