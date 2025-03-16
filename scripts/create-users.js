// Script to create the users table and insert sample users
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

// Sample users
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
    console.log('Creating users table...');
    
    // Check if the users table exists
    const { data: existingTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');
    
    if (tablesError) {
      console.error('Error checking if users table exists:', tablesError);
      
      // Try to create the users table directly
      console.log('Attempting to create users table...');
      
      // Insert sample users one by one
      for (const user of sampleUsers) {
        const { data, error } = await supabase
          .from('users')
          .insert(user)
          .select();
        
        if (error) {
          if (error.code === '42P01') { // Table doesn't exist
            console.error('Users table does not exist and could not be created automatically.');
            console.log('Please run the SQL in supabase/setup-users.sql in the Supabase SQL editor.');
            return;
          } else {
            console.error(`Error inserting user ${user.name}:`, error);
          }
        } else {
          console.log(`Successfully inserted user: ${user.name}`);
        }
      }
    } else if (!existingTables || existingTables.length === 0) {
      console.log('Users table does not exist.');
      console.log('Please run the SQL in supabase/setup-users.sql in the Supabase SQL editor.');
    } else {
      console.log('Users table already exists.');
      
      // Insert sample users
      console.log('Inserting sample users...');
      
      for (const user of sampleUsers) {
        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error(`Error checking if user ${user.email} exists:`, checkError);
          continue;
        }
        
        if (existingUser) {
          console.log(`User ${user.email} already exists.`);
          continue;
        }
        
        // Insert user
        const { data, error } = await supabase
          .from('users')
          .insert(user)
          .select();
        
        if (error) {
          console.error(`Error inserting user ${user.name}:`, error);
        } else {
          console.log(`Successfully inserted user: ${user.name}`);
        }
      }
      
      // Verify users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        console.log(`Users table has ${users.length} users:`);
        users.forEach(user => {
          console.log(`- ${user.name} (${user.email})`);
        });
      }
    }
  } catch (error) {
    console.error('Error creating users table:', error);
  }
}

// Run the function
createUsersTable(); 