-- Create the mergers table
CREATE TABLE IF NOT EXISTS mergers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  acquirer TEXT NOT NULL,
  target TEXT NOT NULL,
  industry TEXT NOT NULL,
  filing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  current_status TEXT NOT NULL,
  status_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  is_followed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on industry for faster filtering
CREATE INDEX IF NOT EXISTS idx_mergers_industry ON mergers(industry);

-- Create an index on filing_date for faster sorting
CREATE INDEX IF NOT EXISTS idx_mergers_filing_date ON mergers(filing_date);

-- Create an index on is_followed for faster filtering
CREATE INDEX IF NOT EXISTS idx_mergers_is_followed ON mergers(is_followed);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_mergers_updated_at ON mergers;
CREATE TRIGGER update_mergers_updated_at
BEFORE UPDATE ON mergers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO mergers (name, acquirer, target, industry, filing_date, current_status, status_date, description)
VALUES
  ('Tech Merger 1', 'TechCorp A', 'TechCorp B', 'Technology', '2023-01-15T00:00:00Z', 'Phase 1', NULL, 'Horizontal merger between two major tech companies'),
  ('Healthcare Acquisition', 'HealthCo', 'MediTech', 'Healthcare', '2023-02-20T00:00:00Z', 'Phase 2', NULL, 'Vertical integration of healthcare provider and medical technology company'),
  ('Energy Merger', 'PowerGen', 'GreenEnergy', 'Energy', '2023-03-10T00:00:00Z', 'Cleared', '2023-06-15T00:00:00Z', 'Merger to expand renewable energy portfolio'),
  ('Financial Services Deal', 'BigBank', 'FinTech Startup', 'Financial Services', '2023-04-05T00:00:00Z', 'Cleared (with commitments)', '2023-07-20T00:00:00Z', 'Acquisition of fintech startup by traditional bank'),
  ('Retail Consolidation', 'MegaRetail', 'LocalShops', 'Retail', '2023-05-12T00:00:00Z', 'Blocked', '2023-08-30T00:00:00Z', 'Merger blocked due to competition concerns'),
  ('Media Acquisition', 'GlobalMedia', 'StreamCo', 'Media', '2023-06-18T00:00:00Z', 'Phase 1', NULL, 'Acquisition of streaming platform by traditional media company'),
  ('Telecom Merger', 'TelecomA', 'TelecomB', 'Telecommunications', '2023-07-22T00:00:00Z', 'Clock stopped', NULL, 'Merger between two major telecommunications providers'),
  ('Manufacturing Deal', 'IndustrialCo', 'SpecialtyMfg', 'Manufacturing', '2023-08-14T00:00:00Z', 'Withdrawn', '2023-10-05T00:00:00Z', 'Acquisition withdrawn after initial review'),
  ('Consumer Goods Merger', 'ConsumerBrands', 'OrganicProducts', 'Consumer Goods', '2023-09-30T00:00:00Z', 'Phase 2', NULL, 'Acquisition of organic products manufacturer'),
  ('Transportation Consolidation', 'GlobalLogistics', 'RegionalTransport', 'Transportation', '2023-10-25T00:00:00Z', 'Phase 1', NULL, 'Merger to expand logistics network'); 