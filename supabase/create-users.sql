-- Add has_phase_2 column to mergers table
ALTER TABLE mergers ADD COLUMN IF NOT EXISTS has_phase_2 BOOLEAN DEFAULT false;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create user_mergers table (for following mergers)
CREATE TABLE IF NOT EXISTS user_mergers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merger_id UUID NOT NULL REFERENCES mergers(id) ON DELETE CASCADE,
  is_following BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, merger_id)
);

-- Apply trigger to user_mergers table
DROP TRIGGER IF EXISTS update_user_mergers_updated_at ON user_mergers;
CREATE TRIGGER update_user_mergers_updated_at
BEFORE UPDATE ON user_mergers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merger_id UUID NOT NULL REFERENCES mergers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, notification_id)
);

-- Apply trigger to user_notifications table
DROP TRIGGER IF EXISTS update_user_notifications_updated_at ON user_notifications;
CREATE TRIGGER update_user_notifications_updated_at
BEFORE UPDATE ON user_notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert sample users
INSERT INTO users (name, email, avatar_url)
VALUES 
  ('John Smith', 'john.smith@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'),
  ('Jane Doe', 'jane.doe@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'),
  ('Alex Johnson', 'alex.johnson@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex')
ON CONFLICT (email) DO NOTHING;

-- Update mergers to set has_phase_2 based on current_status
UPDATE mergers
SET has_phase_2 = (
  current_status IN ('Phase 2', 'Remedies', 'Approved with Remedies', 'Blocked')
); 