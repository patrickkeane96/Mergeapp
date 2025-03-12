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
    const result = await streamText({
      model: openai("gpt-4o"),
      messages: convertToCoreMessages(messages),
      system: "You are a helpful AI assistant",
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in OpenAI chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
