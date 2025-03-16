-- Create merger_status_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS merger_status_history (
  id SERIAL PRIMARY KEY,
  merger_id UUID NOT NULL REFERENCES mergers(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  has_phase_2 BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merger_status_history_merger_id ON merger_status_history(merger_id);
CREATE INDEX IF NOT EXISTS idx_merger_status_history_created_at ON merger_status_history(created_at);

-- Add comment to table
COMMENT ON TABLE merger_status_history IS 'Tracks the history of status changes for mergers'; 