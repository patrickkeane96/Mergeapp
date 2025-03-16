// Script to set up the Supabase database using direct SQL queries
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key is missing. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL statements to create the mergers table and sample data
const createTableSQL = `
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

CREATE INDEX IF NOT EXISTS idx_mergers_industry ON mergers(industry);
CREATE INDEX IF NOT EXISTS idx_mergers_filing_date ON mergers(filing_date);
CREATE INDEX IF NOT EXISTS idx_mergers_is_followed ON mergers(is_followed);
`;

const createTriggerSQL = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mergers_updated_at ON mergers;
CREATE TRIGGER update_mergers_updated_at
BEFORE UPDATE ON mergers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
`;

// Sample data
const sampleData = [
  {
    name: 'Tech Merger 1',
    acquirer: 'TechCorp A',
    target: 'TechCorp B',
    industry: 'Technology',
    filing_date: '2023-01-15T00:00:00Z',
    current_status: 'Phase 1',
    description: 'Horizontal merger between two major tech companies'
  },
  {
    name: 'Healthcare Acquisition',
    acquirer: 'HealthCo',
    target: 'MediTech',
    industry: 'Healthcare',
    filing_date: '2023-02-20T00:00:00Z',
    current_status: 'Phase 2',
    description: 'Vertical integration of healthcare provider and medical technology company'
  },
  {
    name: 'Energy Merger',
    acquirer: 'PowerGen',
    target: 'GreenEnergy',
    industry: 'Energy',
    filing_date: '2023-03-10T00:00:00Z',
    current_status: 'Cleared',
    status_date: '2023-06-15T00:00:00Z',
    description: 'Merger to expand renewable energy portfolio'
  },
  {
    name: 'Financial Services Deal',
    acquirer: 'BigBank',
    target: 'FinTech Startup',
    industry: 'Financial Services',
    filing_date: '2023-04-05T00:00:00Z',
    current_status: 'Cleared (with commitments)',
    status_date: '2023-07-20T00:00:00Z',
    description: 'Acquisition of fintech startup by traditional bank'
  },
  {
    name: 'Retail Consolidation',
    acquirer: 'MegaRetail',
    target: 'LocalShops',
    industry: 'Retail',
    filing_date: '2023-05-12T00:00:00Z',
    current_status: 'Blocked',
    status_date: '2023-08-30T00:00:00Z',
    description: 'Merger blocked due to competition concerns'
  },
  {
    name: 'Media Acquisition',
    acquirer: 'GlobalMedia',
    target: 'StreamCo',
    industry: 'Media',
    filing_date: '2023-06-18T00:00:00Z',
    current_status: 'Phase 1',
    description: 'Acquisition of streaming platform by traditional media company'
  },
  {
    name: 'Telecom Merger',
    acquirer: 'TelecomA',
    target: 'TelecomB',
    industry: 'Telecommunications',
    filing_date: '2023-07-22T00:00:00Z',
    current_status: 'Clock stopped',
    description: 'Merger between two major telecommunications providers'
  },
  {
    name: 'Manufacturing Deal',
    acquirer: 'IndustrialCo',
    target: 'SpecialtyMfg',
    industry: 'Manufacturing',
    filing_date: '2023-08-14T00:00:00Z',
    current_status: 'Withdrawn',
    status_date: '2023-10-05T00:00:00Z',
    description: 'Acquisition withdrawn after initial review'
  },
  {
    name: 'Consumer Goods Merger',
    acquirer: 'ConsumerBrands',
    target: 'OrganicProducts',
    industry: 'Consumer Goods',
    filing_date: '2023-09-30T00:00:00Z',
    current_status: 'Phase 2',
    description: 'Acquisition of organic products manufacturer'
  },
  {
    name: 'Transportation Consolidation',
    acquirer: 'GlobalLogistics',
    target: 'RegionalTransport',
    industry: 'Transportation',
    filing_date: '2023-10-25T00:00:00Z',
    current_status: 'Phase 1',
    description: 'Merger to expand logistics network'
  }
];

async function setupDatabase() {
  try {
    console.log('Setting up Supabase database...');

    // Create the table
    console.log('Creating mergers table...');
    const { error: tableError } = await supabase.rpc('exec', { query: createTableSQL });
    if (tableError) {
      console.error('Error creating table:', tableError);
      return;
    }

    // Create the trigger
    console.log('Creating update trigger...');
    const { error: triggerError } = await supabase.rpc('exec', { query: createTriggerSQL });
    if (triggerError) {
      console.error('Error creating trigger:', triggerError);
      // Continue even if trigger creation fails
    }

    // Check if table already has data
    const { data: existingData, error: countError } = await supabase
      .from('mergers')
      .select('*', { count: 'exact' });
    
    if (countError) {
      console.error('Error checking existing data:', countError);
      return;
    }

    if (existingData && existingData.length > 0) {
      console.log(`Table already contains ${existingData.length} records. Skipping sample data insertion.`);
    } else {
      // Insert sample data
      console.log('Inserting sample data...');
      const { error: insertError } = await supabase
        .from('mergers')
        .insert(sampleData);
      
      if (insertError) {
        console.error('Error inserting sample data:', insertError);
        return;
      }
    }

    // Verify the data
    const { data, error } = await supabase
      .from('mergers')
      .select('*');
    
    if (error) {
      console.error('Error verifying data:', error);
      return;
    }

    console.log(`Successfully set up 'mergers' table with ${data.length} records.`);
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase(); 