import { NextRequest, NextResponse } from 'next/server';
import { toggleFollowMerger, fetchMergerById } from '@/lib/supabase/mergerUtils';

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT /api/mergers/[id]/follow - Toggle follow status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { isFollowed } = await request.json();
    
    // Check if merger exists
    const existingMerger = await fetchMergerById(id);
    if (!existingMerger) {
      return NextResponse.json(
        { error: 'Merger not found' },
        { status: 404 }
      );
    }
    
    const success = await toggleFollowMerger(id, isFollowed);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update follow status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, isFollowed });
  } catch (error) {
    console.error('Error updating follow status:', error);
    return NextResponse.json(
      { error: 'Failed to update follow status' },
      { status: 500 }
    );
  }
} 