import { NextResponse } from 'next/server';
import { fetchFollowedMergers } from '@/lib/supabase/mergerUtils';

// GET /api/mergers/followed - Fetch followed mergers
export async function GET() {
  try {
    const mergers = await fetchFollowedMergers();
    return NextResponse.json(mergers);
  } catch (error) {
    console.error('Error fetching followed mergers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch followed mergers' },
      { status: 500 }
    );
  }
} 