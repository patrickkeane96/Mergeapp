import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import { MergerOutcome } from '@/types/merger';

// PUT /api/mergers/[id]/update-status - Update a merger's status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mergerId = params.id;
    const { status, hasPhase2 } = await request.json();

    if (!mergerId) {
      return NextResponse.json(
        { error: 'Merger ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Map the application's outcome type to database status
    const statusMap: Record<MergerOutcome, string> = {
      'under_review': hasPhase2 ? 'Phase 2' : 'Phase 1',
      'cleared': 'Cleared',
      'blocked': 'Blocked',
      'cleared_with_commitments': 'Cleared (with commitments)'
    };

    const dbStatus = statusMap[status as MergerOutcome] || status;

    // Update the merger's status
    const { data, error } = await supabase
      .from('mergers')
      .update({ 
        current_status: dbStatus,
        has_phase_2: hasPhase2,
        status_date: ['Cleared', 'Blocked', 'Cleared (with commitments)'].includes(dbStatus) ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', mergerId)
      .select();

    if (error) {
      console.error('Error updating merger status:', error);
      return NextResponse.json(
        { error: 'Failed to update merger status' },
        { status: 500 }
      );
    }

    // The status history will be automatically recorded by the database trigger

    return NextResponse.json({ 
      success: true, 
      message: 'Merger status updated successfully',
      data
    });
  } catch (error) {
    console.error('Error in update merger status API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 