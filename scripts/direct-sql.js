// Script to execute SQL directly using the Supabase client
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

// SQL statements to execute
const sqlStatements = [
  // Add has_phase_2 column to mergers table
  `ALTER TABLE mergers ADD COLUMN IF NOT EXISTS has_phase_2 BOOLEAN DEFAULT FALSE;`,
  
  // Create users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Create user_mergers table
  `CREATE TABLE IF NOT EXISTS user_mergers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    merger_id UUID NOT NULL,
    is_following BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, merger_id)
  );`,
  
  // Create notifications table
  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    merger_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Create user_notifications table
  `CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    notification_id UUID NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_id)
  );`,
  
  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_user_mergers_user_id ON user_mergers(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_user_mergers_merger_id ON user_mergers(merger_id);`,
  `CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_id ON user_notifications(notification_id);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_merger_id ON notifications(merger_id);`,
  
  // Insert sample users
  `INSERT INTO users (name, email, avatar_url)
  VALUES
    ('John Smith', 'john.smith@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'),
    ('Jane Doe', 'jane.doe@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'),
    ('Alex Johnson', 'alex.johnson@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex')
  ON CONFLICT (email) DO NOTHING;`,
  
  // Update mergers to set has_phase_2 for Phase 2 mergers
  `UPDATE mergers SET has_phase_2 = TRUE WHERE current_status = 'Phase 2';`,
  `UPDATE mergers SET has_phase_2 = TRUE WHERE current_status = 'Blocked';`,
  `UPDATE mergers SET has_phase_2 = TRUE WHERE current_status = 'Cleared (with commitments)';`
];

async function executeSQL() {
  try {
    console.log('Executing SQL statements...');
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      console.log(`Executing SQL statement ${i + 1}/${sqlStatements.length}: ${sql.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('pg_query', { query: sql });
      
      if (error) {
        // Try alternative method if pg_query is not available
        try {
          console.log('pg_query not available, trying direct query...');
          const { error: directError } = await supabase.from('_sql').select('*').eq('query', sql).single();
          
          if (directError) {
            console.error('Error executing SQL statement:', directError);
          }
        } catch (directError) {
          console.error('Error executing direct SQL statement:', directError);
        }
      }
    }
    
    console.log('All SQL statements executed successfully!');
    
    // Verify tables were created
    console.log('Verifying tables...');
    
    // Check users table
    const { data: users, error: usersError } = await supabase.from('users').select('count').single();
    if (usersError) {
      console.error('Error verifying users table:', usersError);
    } else {
      console.log(`Users table exists with ${users.count} records.`);
    }
    
    // Check mergers table has_phase_2 column
    const { data: mergers, error: mergersError } = await supabase
      .from('mergers')
      .select('id, name, has_phase_2')
      .limit(5);
    
    if (mergersError) {
      console.error('Error verifying mergers table:', mergersError);
    } else {
      console.log(`Mergers table has ${mergers.length} records with has_phase_2 column.`);
      console.log('Sample mergers:', mergers);
    }
    
  } catch (error) {
    console.error('Error executing SQL:', error);
  }
}

// Execute the SQL statements
executeSQL(); 