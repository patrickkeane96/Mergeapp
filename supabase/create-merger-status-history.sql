-- Create merger_status_history table to track status changes
CREATE TABLE IF NOT EXISTS merger_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merger_id UUID NOT NULL REFERENCES mergers(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  has_phase_2 BOOLEAN NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by merger_id
CREATE INDEX IF NOT EXISTS idx_merger_status_history_merger_id ON merger_status_history(merger_id);

-- Create index for faster sorting by changed_at
CREATE INDEX IF NOT EXISTS idx_merger_status_history_changed_at ON merger_status_history(changed_at);

-- Create a trigger to automatically add a record to merger_status_history when a merger's status changes
CREATE OR REPLACE FUNCTION record_merger_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert a record if the status or has_phase_2 has changed
  IF (OLD.current_status IS DISTINCT FROM NEW.current_status) OR 
     (OLD.has_phase_2 IS DISTINCT FROM NEW.has_phase_2) THEN
    INSERT INTO merger_status_history (
      merger_id, 
      status, 
      has_phase_2, 
      changed_at
    ) VALUES (
      NEW.id, 
      NEW.current_status, 
      COALESCE(NEW.has_phase_2, FALSE),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the mergers table
DROP TRIGGER IF EXISTS merger_status_change_trigger ON mergers;
CREATE TRIGGER merger_status_change_trigger
AFTER UPDATE ON mergers
FOR EACH ROW
EXECUTE FUNCTION record_merger_status_change();

-- Backfill the merger_status_history table with initial status for existing mergers
INSERT INTO merger_status_history (merger_id, status, has_phase_2, changed_at)
SELECT 
  id, 
  current_status, 
  COALESCE(has_phase_2, FALSE),
  COALESCE(status_date, filing_date) -- Use status_date if available, otherwise use filing_date
FROM 
  mergers
ON CONFLICT DO NOTHING;

-- Add a function to get the status history for a merger
CREATE OR REPLACE FUNCTION get_merger_status_history(merger_id_param UUID)
RETURNS TABLE (
  status TEXT,
  has_phase_2 BOOLEAN,
  changed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    msh.status,
    msh.has_phase_2,
    msh.changed_at
  FROM 
    merger_status_history msh
  WHERE 
    msh.merger_id = merger_id_param
  ORDER BY 
    msh.changed_at ASC;
END;
$$ LANGUAGE plpgsql; 