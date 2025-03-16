# Supabase Database Setup for Merger Dashboard

This document provides instructions on how to set up the Supabase database for the Merger Dashboard application.

## Prerequisites

- A Supabase account
- Access to the Supabase dashboard

## Setup Instructions

### 1. Environment Variables

Make sure your `.env.local` file contains the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://ofqwgehfqnwijatxbkql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcXdnZWhmcW53aWphdHhia3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMDI1NjksImV4cCI6MjA1NzY3ODU2OX0.xq1K88ANkQe6md6vP5kE5Srbs_aAQDYEbSnjijSx3Vg
```

### 2. Create the Database Table

1. Go to the [Supabase dashboard](https://app.supabase.com/)
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the following SQL:

```sql
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
```

6. Run the query

### 3. Insert Sample Data

After creating the table, run another SQL query to insert sample data:

```sql
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
```

### 4. Verify the Setup

To verify that the setup was successful:

1. Go to the Table Editor in the Supabase dashboard
2. Select the "mergers" table
3. You should see 10 records in the table

## Database Schema

The `mergers` table has the following columns:

- `id`: Unique identifier for the merger (UUID)
- `name`: Name of the merger case
- `acquirer`: Name of the acquiring company
- `target`: Name of the target company
- `industry`: Industry category of the merger
- `filing_date`: Date when the merger was filed
- `current_status`: Current status of the merger (e.g., "Phase 1", "Phase 2", "Cleared", "Blocked", etc.)
- `status_date`: Date when the current status was set (null for ongoing cases)
- `description`: Optional description of the merger
- `is_followed`: Boolean indicating whether the user is following this merger
- `created_at`: Timestamp when the record was created
- `updated_at`: Timestamp when the record was last updated

## Using the Database in the Application

The application is already configured to use the Supabase database. The following files contain the code for interacting with the database:

- `src/lib/supabase/supabase.ts`: Supabase client configuration
- `src/lib/supabase/mergerUtils.ts`: Utility functions for interacting with the mergers table
- `src/lib/hooks/useMergers.ts`: React hook for using the merger data in components
- `src/app/api/mergers/*`: API endpoints for CRUD operations on mergers

Once the database is set up, you can start the application and it will automatically connect to your Supabase database and display the merger data.

## Troubleshooting

If you encounter any issues with the database setup:

1. Make sure your Supabase URL and anon key are correct in the `.env.local` file
2. Check the Supabase dashboard for any error messages
3. Verify that the SQL queries executed successfully
4. Check the browser console for any error messages when running the application 