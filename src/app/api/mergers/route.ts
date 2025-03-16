import { NextRequest, NextResponse } from 'next/server';
import { fetchMergers, createMerger } from '@/lib/supabase/mergerUtils';
import { Merger } from '@/types/merger';

// GET /api/mergers - Fetch all mergers with optional limit parameter
export async function GET(request: NextRequest) {
  try {
    // Get the limit parameter from the query string (default to 10000)
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '10000';
    
    const mergers = await fetchMergers(parseInt(limit));
    return NextResponse.json(mergers);
  } catch (error) {
    console.error('Error fetching mergers:', error);
    return NextResponse.json({ error: 'Failed to fetch mergers' }, { status: 500 });
  }
}

// POST /api/mergers - Create a new merger
export async function POST(request: NextRequest) {
  try {
    const mergerData = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'acquirer', 'target', 'industry', 'startDate'];
    for (const field of requiredFields) {
      if (!mergerData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const merger = await createMerger(mergerData as Partial<Merger>);
    
    if (!merger) {
      return NextResponse.json(
        { error: 'Failed to create merger' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(merger, { status: 201 });
  } catch (error) {
    console.error('Error creating merger:', error);
    return NextResponse.json(
      { error: 'Failed to create merger' },
      { status: 500 }
    );
  }
} 