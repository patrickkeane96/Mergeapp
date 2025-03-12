import { NextResponse } from "next/server";
import fs from "fs";
import OpenAI from "openai";

// Check if API key exists, otherwise use a placeholder for build process
const apiKey = process.env.OPENAI_API_KEY || "sk-placeholder";
let openai: OpenAI | null = null;

try {
  openai = new OpenAI({ apiKey });
} catch (error) {
  console.warn("OpenAI client initialization failed:", error);
}

export async function POST(req: Request) {
  // Return error if OpenAI client is not initialized
  if (!openai) {
    return NextResponse.json(
      { error: "OpenAI API is not configured. Please set OPENAI_API_KEY environment variable." },
      { status: 501 }
    );
  }

  try {
    const body = await req.json();
    const base64Audio = body.audio;

    // Convert the base64 audio data to a Buffer
    const audio = Buffer.from(base64Audio, "base64");

    // Define the file path for storing the temporary WAV file
    const filePath = "tmp/input.wav";

    // Ensure tmp directory exists
    if (!fs.existsSync("tmp")) {
      fs.mkdirSync("tmp", { recursive: true });
    }

    // Write the audio data to a temporary WAV file synchronously
    // Use audio as a NodeJS.ArrayBufferView which is compatible with fs.writeFileSync
    fs.writeFileSync(filePath, audio as unknown as NodeJS.ArrayBufferView);

    // Create a readable stream from the temporary WAV file
    const readStream = fs.createReadStream(filePath);

    const data = await openai.audio.transcriptions.create({
      file: readStream,
      model: "whisper-1",
    });

    // Remove the temporary file after successful processing
    fs.unlinkSync(filePath);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json(
      { error: "Failed to process audio transcription" },
      { status: 500 }
    );
  }
}
