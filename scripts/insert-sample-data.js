// Script to insert sample data into the mergers table
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

async function insertSampleData() {
  try {
    console.log('Inserting sample data into the mergers table...');

    // Insert sample data
    const { data, error } = await supabase
      .from('mergers')
      .insert(sampleData)
      .select();
    
    if (error) {
      console.error('Error inserting sample data:', error);
      return;
    }

    console.log(`Successfully inserted ${data.length} records into the 'mergers' table.`);
    
    // Verify the data
    const { data: allData, error: fetchError } = await supabase
      .from('mergers')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching data:', fetchError);
      return;
    }

    console.log(`Total records in the 'mergers' table: ${allData.length}`);
    console.log('Sample data insertion completed successfully!');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
}

insertSampleData(); 