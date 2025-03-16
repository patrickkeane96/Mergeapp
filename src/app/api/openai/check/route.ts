import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if the API key is set and not a placeholder
    const apiKey = process.env.OPENAI_API_KEY || '';
    const isPlaceholder = apiKey.startsWith('sk-place') || 
                         apiKey === '' || 
                         apiKey.length < 20;
    
    if (isPlaceholder) {
      console.log('OpenAI API key is not properly configured');
      return NextResponse.json({ available: false, reason: 'API key not configured' });
    }
    
    // Return success
    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Error checking OpenAI API:', error);
    return NextResponse.json({ available: false, reason: 'Error checking API' });
  }
} 