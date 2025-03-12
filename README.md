# Merger Reform Calculator

A Next.js application for calculating timelines in the Australian merger reform process.

## Deployment Instructions

### Setting up Gemini API Key in Vercel

The application uses Google's Gemini API for generating AI summaries. To make this work in your Vercel deployment, you need to set up the API key as an environment variable:

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Create an account or sign in
   - Navigate to the API keys section
   - Create a new API key

2. **Add the API Key to Vercel**:
   - Go to your project in the Vercel dashboard
   - Click on "Settings" tab
   - Select "Environment Variables" from the left sidebar
   - Add a new variable with:
     - Name: `GEMINI_API_KEY`
     - Value: Your Gemini API key
   - Make sure it's added to all environments (Production, Preview, Development)
   - Click "Save"

3. **Redeploy Your Application**:
   - After adding the environment variable, you need to redeploy your application
   - Go to the "Deployments" tab
   - Click on the "..." menu next to your latest deployment
   - Select "Redeploy" to apply the new environment variable

### Troubleshooting

If you see a `501` error when trying to generate an AI summary, it means the Gemini API key is not properly configured. Check that:

1. The API key is correctly entered in Vercel's environment variables
2. The key is valid and not expired
3. You've redeployed the application after adding the key

## Local Development

To run the application locally:

1. Clone the repository
2. Create a `.env.local` file in the root directory with:
   ```
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- Calculate business days in the merger review process
- Account for holidays, stop clocks, and commitment extensions
- Generate AI summaries of the timeline
- Ask follow-up questions about the merger process
- Export timeline as PDF