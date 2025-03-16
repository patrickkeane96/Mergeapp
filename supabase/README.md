# Supabase Database Setup for Merger Dashboard

This directory contains the database schema and migrations for the Merger Dashboard application.

## Database Schema

The main table in the database is `mergers`, which stores information about merger cases:

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

## Setting Up Supabase

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Add the following environment variables to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Running Migrations

You can run the migrations manually by copying the SQL from the migration files and executing it in the Supabase SQL editor.

Alternatively, if you have the Supabase CLI installed, you can run:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Sample Data

The migration file includes sample data to get you started. You can add more data through the Supabase dashboard or using the API. 