-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_mergers table to track which users follow which mergers
CREATE TABLE IF NOT EXISTS user_mergers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merger_id UUID NOT NULL REFERENCES mergers(id) ON DELETE CASCADE,
  is_following BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, merger_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  merger_id UUID REFERENCES mergers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_notifications table to track which users have read which notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, notification_id)
);

-- Add has_phase_2 column to mergers table to track which mergers went through phase 2
ALTER TABLE mergers ADD COLUMN IF NOT EXISTS has_phase_2 BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_mergers_user_id ON user_mergers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mergers_merger_id ON user_mergers(merger_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_notifications_merger_id ON notifications(merger_id);

-- Create update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for user_mergers table
DROP TRIGGER IF EXISTS update_user_mergers_updated_at ON user_mergers;
CREATE TRIGGER update_user_mergers_updated_at
BEFORE UPDATE ON user_mergers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for user_notifications table
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
  ('Alex Johnson', 'alex.johnson@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'); 