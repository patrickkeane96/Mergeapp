import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StreamingTextResponse } from "ai";

// Initialize the Gemini API client
let genAI: GoogleGenerativeAI | null = null;
try {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (error) {
  console.warn("Failed to initialize Gemini client:", error);
}

// Helper function to convert Gemini stream to ReadableStream
function geminiStreamToReadableStream(geminiStream: AsyncGenerator<any, any, unknown>) {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of geminiStream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function POST(request: Request) {
  // Check if API key is missing or is the placeholder
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    return NextResponse.json(
      { 
        error: "Gemini API key is not configured. Please add your API key to the .env.local file. You can get a key from https://ai.google.dev/" 
      },
      { status: 501 }
    );
  }
  
  // Check if API client initialization failed
  if (!genAI) {
    return NextResponse.json(
      { 
        error: "Failed to initialize Gemini client. Please check that your API key is valid." 
      },
      { status: 501 }
    );
  }

  try {
    const { 
      pdfBase64, 
      customPrompt, 
      followUpQuestion, 
      previousSummary, 
      chatHistory,
      // New text-based parameters
      timelineData,
      inputParams
    } = await request.json();
    
    // Handle follow-up questions using chat capabilities
    if (followUpQuestion && previousSummary) {
      // Use a more advanced model for follow-up questions if available
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro", // Use more advanced model for follow-ups
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300,
        },
      });
      
      // Legal expert instruction to include in the prompt instead of systemInstruction
      const legalExpertInstruction = "You are a legal expert specializing in Australian merger law and effective at summarising procedural steps in an understandable manner. You focus on processes under Australia's new merger regime, and are well aware of the new bill, ACCC guidance and transitional measures. You like to focus on information you're sure about and documents the user has provided to you on their timelines.";
      
      // Create a chat session with history
      const chat = model.startChat({
        history: chatHistory || [
          {
            role: "user",
            parts: [{ text: "Here is a summary of an ACCC merger review timeline for you to analyse: " + previousSummary }],
          },
          {
            role: "model",
            parts: [{ text: "I understand. I'll help answer any questions you have about this merger review timeline." }],
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300,
        },
      });
      
      // Send the follow-up question with streaming, including the legal expert instruction in the prompt
      const result = await chat.sendMessageStream(
        `${legalExpertInstruction}\n\nBased on the merger review timeline I shared earlier, please answer this question in 200 words or less, taking into account what major law firms and the ACCC say on this topic, focusing on the upcoming merger reforms and their procedural timeframes - but your focus no matter what should be on answering questions by reference to documents already provided to you where they have the answer (e.g. timeframes applying to the user: ${followUpQuestion}`
      );
      
      // Convert Gemini stream to ReadableStream and return streaming response
      const readableStream = geminiStreamToReadableStream(result.stream);
      return new StreamingTextResponse(readableStream);
    }
    
    // Handle initial summary generation with text data instead of PDF
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // If we have text-based timeline data, use that instead of PDF
    if (timelineData && inputParams) {
      // Format the timeline data into a readable text format
      const formattedTimeline = formatTimelineData(timelineData, inputParams);
      
      // Prepare the prompt with text data
      const textPrompt = `Summarize the status of the ACCC's review in 3-4 sentences identifying the current phase, whether the termination deadline has been extended due to commitments being offered or the ACCC stopping the clock (and how long), and the next step that is upcoming in the timeline based on today's date. Respond only with this summary, do not include any commentary or different options or headings. Assume the new regime is in force.

Here is the timeline data:
${formattedTimeline}

An example summary is as follows: The ACCC is currently in the first phase of its review, with its decision on whether to commence a phase 2 review due on 1 January 2025. That date has been extended by 10 days due to the ACCC stopping the clock, and a further 15 days due to commitments being offered.`;

      // Generate content with streaming
      const result = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: customPrompt || textPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
        },
      });

      // Convert Gemini stream to ReadableStream and return streaming response
      const readableStream = geminiStreamToReadableStream(result.stream);
      return new StreamingTextResponse(readableStream);
    } 
    // Fallback to PDF-based approach if text data is not provided (for backward compatibility)
    else if (pdfBase64) {
      // Prepare the prompt
      const prompt = `Summarize the status of the ACCC's review in 3-4 sentences identifying the current phase, whether the termination deadline has been extended due to commitments being offered or the ACCC stopping the clock (and how long), and the next step that is upcoming in the timeline based on today's date. Respond only with this summary, do not include any commentary or different options or headings. Assume the new regime is in force. An example is as follows: The ACCC is currently in the first phase of its review, with its decision on whether to commence a phase 2 review due on 1 January 2025. That date has been extended by 10 days due to the ACCC stopping the clock, and a further 15 days due to commitments being offered.`;
      
      // Create parts for the multimodal request
      const parts = [
        { text: customPrompt || prompt },
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBase64
          }
        }
      ];

      // Generate content with streaming
      const result = await model.generateContentStream({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
        },
      });

      // Convert Gemini stream to ReadableStream and return streaming response
      const readableStream = geminiStreamToReadableStream(result.stream);
      return new StreamingTextResponse(readableStream);
    } else {
      return NextResponse.json({ 
        error: "No timeline data provided. Please provide either timelineData and inputParams or pdfBase64." 
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Error from Gemini API:", error);
    
    // Provide more specific error messages for common issues
    const errorMessage = (error as Error).message;
    if (errorMessage.includes("API_KEY_INVALID")) {
      return NextResponse.json({ 
        error: "The Gemini API key is invalid. Please check your API key and make sure it's correctly set in the .env.local file." 
      }, { status: 401 });
    } else if (errorMessage.includes("PERMISSION_DENIED")) {
      return NextResponse.json({ 
        error: "Permission denied. Your API key may not have access to the Gemini model. Please check your API key permissions." 
      }, { status: 403 });
    } else if (errorMessage.includes("MODEL_NOT_FOUND")) {
      // Fallback to gemini-1.5-flash if pro model is not available
      return NextResponse.json({ 
        error: "The advanced model is not available with your API key. Please try again with the standard model." 
      }, { status: 404 });
    } else if (errorMessage.includes("Request Entity Too Large") || errorMessage.includes("413")) {
      return NextResponse.json({ 
        error: "The request is too large. Please try using the text-based approach instead of PDF." 
      }, { status: 413 });
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Helper function to format timeline data into a readable text format
function formatTimelineData(timelineData: any[], inputParams: any): string {
  let formattedText = "";
  
  // Add input parameters
  formattedText += "Input Parameters:\n";
  formattedText += `Transaction Complexity: ${inputParams.phaseOption === "phase1" ? "Phase 1 Only" : "Phase 1 and Phase 2"}\n`;
  formattedText += `Filing Date: ${inputParams.filingDate}\n`;
  formattedText += `Pre-Assessment Days: ${inputParams.preAssessmentDays}\n`;
  formattedText += `Clock Stopped: ${inputParams.stopClockEnabled ? "Yes" : "No"}\n`;
  
  if (inputParams.stopClockEnabled) {
    formattedText += `  Stop Clock Start: ${inputParams.stopClockDate}\n`;
    formattedText += `  Stop Clock Duration: ${inputParams.stopClockDuration} days\n`;
  }
  
  formattedText += `Commitments Offered: ${inputParams.commitmentsEnabled ? "Yes" : "No"}\n`;
  
  if (inputParams.commitmentsEnabled) {
    formattedText += `  Phase: ${inputParams.commitmentPhase === "phase1" ? "Phase One" : "Phase Two"}\n`;
    formattedText += `  Extension Duration: ${inputParams.extensionDuration} days\n`;
  }
  
  formattedText += `Total Timeline: ${inputParams.totalDays} days\n\n`;
  
  // Add timeline events
  formattedText += "Timeline Events:\n";
  
  timelineData.forEach((event, index) => {
    formattedText += `${index + 1}. ${event.event} - Day ${event.day} - Date: ${event.date} - ${event.dayOfWeek}\n`;
    
    if (event.isStopClock && event.stopClockDuration) {
      formattedText += `   (Stop Clock Duration: ${event.stopClockDuration} days)\n`;
    }
    
    if (event.extensionDays) {
      formattedText += `   (Extended by ${event.extensionDays} days due to commitment proposal)\n`;
    }
    
    if (event.isPast) {
      formattedText += `   (This event is in the past)\n`;
    }
  });
  
  // Add today's date for reference
  formattedText += `\nToday's Date: ${new Date().toDateString()}\n`;
  
  return formattedText;
} 