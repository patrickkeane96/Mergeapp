import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "Deepgram API is not configured. Please set DEEPGRAM_API_KEY environment variable." },
      { status: 501 }
    );
  }
  
  return NextResponse.json({
    key: apiKey,
  });
}
