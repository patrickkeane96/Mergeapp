import { NextResponse } from "next/server";
import Replicate from "replicate";

// Initialize Replicate client only if API token is available
let replicate: Replicate | null = null;
try {
  if (process.env.REPLICATE_API_TOKEN) {
    replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }
} catch (error) {
  console.warn("Failed to initialize Replicate client:", error);
}

export async function POST(request: Request) {
  if (!process.env.REPLICATE_API_TOKEN || !replicate) {
    return NextResponse.json(
      { error: "Replicate API is not configured. Please set REPLICATE_API_TOKEN environment variable." },
      { status: 501 }
    );
  }

  try {
    const { prompt } = await request.json();

    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt: prompt,
          image_dimensions: "512x512",
          num_outputs: 1,
          num_inference_steps: 50,
          guidance_scale: 7.5,
          scheduler: "DPMSolverMultistep",
        },
      }
    );

    return NextResponse.json({ output }, { status: 200 });
  } catch (error) {
    console.error("Error from Replicate API:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
