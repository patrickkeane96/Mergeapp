import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
let genAI: GoogleGenerativeAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (error) {
  console.warn("Failed to initialize Gemini client:", error);
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY || !genAI) {
    return NextResponse.json(
      { error: "Gemini API is not configured. Please set GEMINI_API_KEY environment variable." },
      { status: 501 }
    );
  }

  try {
    const { pdfBase64 } = await request.json();
    
    // Create a model instance
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Prepare the prompt
    const prompt = `Summarize the status of this merger review in four sentences explaining the status, the phase that the merger review is in, whether remedies have been offered yet, whether the termination deadline has been extended due to remedies or stop clocks and by how long, and the next event that is upcoming in the timeline based on today's date. Respond only with this summary, do not include any commentary or different options or headings.`;
    
    // Create parts for the multimodal request
    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64
        }
      }
    ];

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 200,
      },
    });

    const response = result.response;
    const text = response.text();

    return NextResponse.json({ summary: text }, { status: 200 });
  } catch (error) {
    console.error("Error from Gemini API:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 