import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  // Check if API key exists
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API is not configured. Please set OPENAI_API_KEY environment variable." },
      { status: 501 }
    );
  }

  try {
    const { messages } = await req.json();
    
    // Check if this is a merger search query by looking at the first message
    const isMergerSearch = messages.length > 0 && 
      messages[0].role === 'system' && 
      messages[0].content.includes('parses natural language search queries about mergers');
    
    // For merger searches, use a much simpler prompt to avoid format issues
    const systemPrompt = isMergerSearch 
      ? `You are a helpful assistant that converts natural language merger search queries into structured JSON.
         Respond with ONLY a valid JSON object.
         Do not include markdown code blocks, explanations, or any other text.
         
         The JSON should include these possible fields:
         {"industry": ["Industry1", "Industry2"], "outcome": ["under_review", "cleared", "blocked", "cleared_with_commitments"], "recentActivity": number, "dateRange": {"from": "YYYY-MM-DD", "to": "YYYY-MM-DD"}, "keywords": ["word1", "word2"], "explanation": "Brief explanation"}
         
         Use only the fields that are relevant to the query.`
      : "You are a helpful AI assistant";
    
    // Use a fixed model for more consistent results
    const model = "gpt-3.5-turbo";
    
    try {
      const result = await streamText({
        model: openai(model),
        messages: convertToCoreMessages(messages),
        system: systemPrompt,
        temperature: isMergerSearch ? 0 : 0.7, // Zero temperature for deterministic JSON
        maxTokens: isMergerSearch ? 500 : 1000, // Limit tokens for faster responses
      });
      
      return result.toDataStreamResponse();
    } catch (apiError: any) {
      console.error("OpenAI API error:", apiError);
      
      // Return a specific error for client-side handling
      return NextResponse.json(
        { error: "OpenAI API error", message: apiError.message || "Unknown error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in request processing:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 400 }
    );
  }
}
