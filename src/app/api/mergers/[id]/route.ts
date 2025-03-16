import { NextRequest, NextResponse } from 'next/server';
import { fetchMergerById, updateMerger, deleteMerger } from '@/lib/supabase/mergerUtils';
import { Merger } from '@/types/merger';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/mergers/[id] - Fetch a single merger
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const merger = await fetchMergerById(id);
    
    if (!merger) {
      return NextResponse.json(
        { error: 'Merger not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(merger);
  } catch (error) {
    console.error('Error fetching merger:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merger' },
      { status: 500 }
    );
  }
}

// PUT /api/mergers/[id] - Update a merger
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const mergerData = await request.json();
    
    // Check if merger exists
    const existingMerger = await fetchMergerById(id);
    if (!existingMerger) {
      return NextResponse.json(
        { error: 'Merger not found' },
        { status: 404 }
      );
    }
    
    const updatedMerger = await updateMerger(id, mergerData as Partial<Merger>);
    
    if (!updatedMerger) {
      return NextResponse.json(
        { error: 'Failed to update merger' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedMerger);
  } catch (error) {
    console.error('Error updating merger:', error);
    return NextResponse.json(
      { error: 'Failed to update merger' },
      { status: 500 }
    );
  }
}

// DELETE /api/mergers/[id] - Delete a merger
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Check if merger exists
    const existingMerger = await fetchMergerById(id);
    if (!existingMerger) {
      return NextResponse.json(
        { error: 'Merger not found' },
        { status: 404 }
      );
    }
    
    const success = await deleteMerger(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete merger' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting merger:', error);
    return NextResponse.json(
      { error: 'Failed to delete merger' },
      { status: 500 }
    );
  }
} 