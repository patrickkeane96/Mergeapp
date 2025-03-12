import { anthropic } from "@ai-sdk/anthropic";
import { convertToCoreMessages, streamText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  // Check if API key exists
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Anthropic API is not configured. Please set ANTHROPIC_API_KEY environment variable." },
      { status: 501 }
    );
  }

  try {
    const { messages } = await req.json();
    const result = await streamText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      messages: convertToCoreMessages(messages),
      system: "You are a helpful AI assistant",
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in Anthropic chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
