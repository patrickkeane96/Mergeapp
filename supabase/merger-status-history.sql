-- Create merger_status_history table to track status changes
CREATE TABLE IF NOT EXISTS merger_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merger_id UUID NOT NULL REFERENCES mergers(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  has_phase_2 BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_merger_status_history_merger_id ON merger_status_history(merger_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_merger_status_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_merger_status_history_updated_at
BEFORE UPDATE ON merger_status_history
FOR EACH ROW
EXECUTE FUNCTION update_merger_status_history_updated_at();

-- Create trigger to automatically add a status history entry when a merger's status changes
CREATE OR REPLACE FUNCTION record_merger_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND 
      (OLD.current_status <> NEW.current_status OR OLD.has_phase_2 <> NEW.has_phase_2)) THEN
    
    INSERT INTO merger_status_history (merger_id, status, has_phase_2)
    VALUES (NEW.id, NEW.current_status, NEW.has_phase_2);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER record_merger_status_change
AFTER INSERT OR UPDATE ON mergers
FOR EACH ROW
EXECUTE FUNCTION record_merger_status_change();

-- Populate initial history for existing mergers
INSERT INTO merger_status_history (merger_id, status, has_phase_2)
SELECT id, current_status, has_phase_2
FROM mergers
WHERE NOT EXISTS (
  SELECT 1 FROM merger_status_history 
  WHERE merger_status_history.merger_id = mergers.id
); 