import { NextRequest, NextResponse } from 'next/server';
import { fetchMergersByIndustry } from '@/lib/supabase/mergerUtils';

interface RouteParams {
  params: {
    industry: string;
  };
}

// GET /api/mergers/industry/[industry] - Fetch mergers by industry
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { industry } = params;
    const decodedIndustry = decodeURIComponent(industry);
    
    const mergers = await fetchMergersByIndustry(decodedIndustry);
    return NextResponse.json(mergers);
  } catch (error) {
    console.error('Error fetching mergers by industry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mergers by industry' },
      { status: 500 }
    );
  }
} 