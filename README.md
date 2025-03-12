# Business Days Calculator

A sophisticated web application for calculating and visualizing merger control timelines. This tool helps legal professionals and business analysts track important dates and deadlines throughout the merger control process.

## Features

- **Timeline Visualization**: Interactive chart showing key events with color-coded indicators
- **Phase Selection**: Choose between "Phase 1 Only" or "Phase 1 and Phase 2" complexity levels
- **Pre-Assessment Period**: Configure pre-assessment days before the official filing date
- **Stop Clock Functionality**: Add stop clock periods with customizable durations
- **Business Day Calculation**: Automatically accounts for weekends and holidays
- **Total Timeline Counter**: Track the total duration of the merger control process
- **PDF Export**: Generate and download a PDF report of the timeline and parameters
- **AI Summary**: Generate a concise summary of the merger review status using Google's Gemini AI

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Google Gemini API key (for AI summary feature)

### Installation

1. Clone the repository
   ```
   git clone [repository-url]
   cd [repository-name]
   ```

2. Install dependencies
   ```
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory with the following variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   You can obtain a Gemini API key from [Google AI Studio](https://ai.google.dev/).

4. Start the development server
   ```
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Select the anticipated transaction complexity (Phase 1 Only or Phase 1 and Phase 2)
2. Enter any pre-assessment days (if applicable)
3. Select the filing date using the calendar picker
4. Enable stop clock if needed and configure its start date and duration
5. View the generated timeline visualization and detailed event table
6. Click "Export PDF" to download a PDF report of the timeline
7. Click "Generate AI Summary" to get a concise summary of the merger review status

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Chart.js
- date-fns
- jsPDF
- Google Generative AI (Gemini)