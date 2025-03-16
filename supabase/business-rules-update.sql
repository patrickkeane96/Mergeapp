-- Update the database to enforce business rules

-- 1. Add the acquirer and target columns if they don't exist
ALTER TABLE mergers
ADD COLUMN IF NOT EXISTS target TEXT,
ADD COLUMN IF NOT EXISTS acquirer TEXT;

-- 2. Update target and acquirer based on existing merger names
UPDATE mergers
SET 
  target = CASE 
    WHEN name LIKE '%/%' THEN SPLIT_PART(name, ' / ', 1)
    ELSE name
  END,
  acquirer = CASE 
    WHEN name LIKE '%/%' THEN SPLIT_PART(name, ' / ', 2)
    ELSE name || ' Acquisition'
  END
WHERE target IS NULL OR acquirer IS NULL;

-- 3. Create a trigger to ensure target and acquirer are always set
CREATE OR REPLACE FUNCTION ensure_target_acquirer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target IS NULL OR NEW.acquirer IS NULL THEN
    IF NEW.name LIKE '%/%' THEN
      NEW.target = SPLIT_PART(NEW.name, ' / ', 1);
      NEW.acquirer = SPLIT_PART(NEW.name, ' / ', 2);
    ELSE
      NEW.target = NEW.name;
      NEW.acquirer = NEW.name || ' Acquisition';
    END IF;
  END IF;
  
  -- Generate name from target and acquirer if not provided
  IF NEW.name IS NULL THEN
    NEW.name = NEW.target || ' / ' || NEW.acquirer;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_target_acquirer_trigger ON mergers;
CREATE TRIGGER ensure_target_acquirer_trigger
BEFORE INSERT OR UPDATE ON mergers
FOR EACH ROW
EXECUTE FUNCTION ensure_target_acquirer();

-- 4. Create a trigger to enforce business rules for status changes
CREATE OR REPLACE FUNCTION enforce_merger_status_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure blocked status is only for Phase 2 mergers
  IF NEW.current_status = 'Blocked' AND NOT NEW.has_phase_2 THEN
    NEW.has_phase_2 = TRUE; -- Force Phase 2 for blocked mergers
  END IF;
  
  -- If merger is in Phase 2, ensure there's a Phase 1 decision date
  IF NEW.has_phase_2 AND NOT EXISTS (
    SELECT 1 FROM merger_status_history 
    WHERE merger_id = NEW.id AND has_phase_2 = TRUE
  ) THEN
    -- Add a Phase 1 decision date if not present
    INSERT INTO merger_status_history (
      merger_id, 
      status, 
      has_phase_2, 
      created_at
    ) VALUES (
      NEW.id, 
      'Phase 2', 
      TRUE, 
      NOW() - INTERVAL '1 day'
    );
  END IF;
  
  -- Add NOCC for Phase 2 mergers if not present already
  IF NEW.has_phase_2 AND NEW.current_status = 'Phase 2' AND NOT EXISTS (
    SELECT 1 FROM merger_status_history 
    WHERE merger_id = NEW.id AND status = 'NOCC Issued'
  ) THEN
    -- Add NOCC at a date after Phase 2 start
    INSERT INTO merger_status_history (
      merger_id, 
      status, 
      has_phase_2, 
      created_at
    ) VALUES (
      NEW.id, 
      'NOCC Issued', 
      TRUE, 
      NOW() - INTERVAL '12 hour'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_merger_status_rules_trigger ON mergers;
CREATE TRIGGER enforce_merger_status_rules_trigger
BEFORE UPDATE ON mergers
FOR EACH ROW
EXECUTE FUNCTION enforce_merger_status_rules();

-- 5. Update all existing mergers to ensure business rules are enforced
-- Make sure all blocked mergers are in Phase 2
UPDATE mergers SET has_phase_2 = TRUE WHERE current_status = 'Blocked';

-- Add NOCC entries for Phase 2 mergers that don't have them
INSERT INTO merger_status_history (merger_id, status, has_phase_2, created_at)
SELECT 
  m.id, 
  'NOCC Issued', 
  TRUE, 
  NOW() - INTERVAL '1 day'
FROM mergers m
WHERE 
  m.has_phase_2 = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM merger_status_history 
    WHERE merger_id = m.id AND status = 'NOCC Issued'
  );

-- 6. Update merger status history to record phase 1 decision for phase 2 mergers
INSERT INTO merger_status_history (merger_id, status, has_phase_2, created_at)
SELECT 
  m.id, 
  'Phase 1 Determination', 
  TRUE, 
  (SELECT MIN(created_at) - INTERVAL '1 day' FROM merger_status_history WHERE merger_id = m.id AND has_phase_2 = TRUE)
FROM mergers m
WHERE 
  m.has_phase_2 = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM merger_status_history 
    WHERE merger_id = m.id AND status = 'Phase 1 Determination'
  ); 