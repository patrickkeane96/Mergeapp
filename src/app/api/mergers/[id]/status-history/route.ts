import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';

// GET /api/mergers/[id]/status-history - Get status history for a specific merger
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mergerId = params.id;

    if (!mergerId) {
      return NextResponse.json(
        { error: 'Merger ID is required' },
        { status: 400 }
      );
    }

    // Fetch the merger status history
    const { data, error } = await supabase
      .from('merger_status_history')
      .select('*')
      .eq('merger_id', mergerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching merger status history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch merger status history' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in merger status history API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 