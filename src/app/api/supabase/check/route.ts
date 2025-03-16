import { NextResponse } from 'next/server';
import { checkSupabaseConnection } from '@/lib/supabase/supabase';

export async function GET() {
  try {
    const result = await checkSupabaseConnection();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking Supabase API:', error);
    return NextResponse.json({ available: false, reason: 'Error checking API' });
  }
} 