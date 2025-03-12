"use client";

import * as React from "react";
import { format, addDays, isWeekend, parseISO, addBusinessDays, subBusinessDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Check, ChevronsUpDown, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { TimelineChart, TimelineEvent, StopClockPeriod } from "./timeline-chart";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// List of public holidays to exclude
const holidays_list = [
  "2025-01-01", "2025-01-26", "2025-04-06", "2025-04-07", "2025-04-09", "2025-04-25", 
  "2025-06-09", "2025-08-25", "2025-10-06", "2025-12-23", "2025-12-24", "2025-12-25", "2025-12-26", 
  "2025-12-27", "2025-12-28", "2025-12-30", "2025-12-31", "2026-01-01", "2026-01-26", "2026-04-03", 
  "2026-04-04", "2026-04-06", "2026-04-25", "2026-06-08", "2026-08-24", "2026-10-05", "2026-12-23", 
  "2026-12-24", "2026-12-25", "2026-12-26", "2026-12-27", "2026-12-28", "2026-12-30", "2026-12-31", 
  "2027-01-01", "2027-01-26", "2027-04-07", "2027-04-08", "2027-04-10", "2027-04-25", "2027-06-14"
];

// Convert to Date objects
const holidays = holidays_list.map(date => parseISO(date));

// List of milestone days with corresponding business days
const milestones = {
  "Earliest date ACCC can clear transaction": 15,
  "Final date for Phase 1 remedy proposals": 20,
  "Phase 1 determination": 30,
  "ACCC issues notice of competition concerns": 55,
  "Response to notice of competition concerns due": 80,
  "Final date for Phase 2 remedy proposals": 90,
  "Final date to provide information to ACCC": 105,
  "Phase 2 determination": 120
};

// Phase 1 milestones only
const phase1Milestones = {
  "Earliest date ACCC can clear transaction": 15,
  "Final date for Phase 1 remedy proposals": 20,
  "Phase 1 determination": 30
};

// Function to calculate business days
function calculateBusinessDate(startDate: Date, daysToAdd: number, holidays: Date[]): Date {
  let currentDate = new Date(startDate);
  let remainingDays = daysToAdd;

  while (remainingDays > 0) {
    currentDate = addDays(currentDate, 1);
    
    // Skip weekends and holidays
    if (!isWeekend(currentDate) && !isHoliday(currentDate, holidays)) {
      remainingDays -= 1;
    }
  }
  
  return currentDate;
}

// Helper function to check if a date is a holiday
function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some(holiday => 
    holiday.getFullYear() === date.getFullYear() && 
    holiday.getMonth() === date.getMonth() && 
    holiday.getDate() === date.getDate()
  );
}

// Type for our results
type ResultRow = {
  event: string;
  day: number;
  date: Date;
  dayOfWeek: string;
  isStopClock?: boolean;
  isStopClockEnd?: boolean;
  isPhaseDecision?: boolean;
  isPreAssessment?: boolean;
  stopClockDuration?: number;
  extensionDays?: number; // Added for commitments extension
  isPast?: boolean; // Added to track if event is in the past
};

// Default date for calendar (January 1, 2026)
const DEFAULT_CALENDAR_DATE = new Date(2026, 0, 1);

// Phase options
type PhaseOption = "phase1" | "phase1and2";

// Commitment phase options
type CommitmentPhaseOption = "phase1" | "phase2";

export function BusinessDaysCalculator() {
  const [filingDate, setFilingDate] = React.useState<Date | undefined>(undefined);
  const [stopClockEnabled, setStopClockEnabled] = React.useState(false);
  const [stopClockDate, setStopClockDate] = React.useState<Date | undefined>(undefined);
  const [stopClockDuration, setStopClockDuration] = React.useState<number>(0);
  const [preAssessmentDays, setPreAssessmentDays] = React.useState<number>(0);
  const [results, setResults] = React.useState<ResultRow[]>([]);
  const [timelineEvents, setTimelineEvents] = React.useState<TimelineEvent[]>([]);
  const [stopClockPeriod, setStopClockPeriod] = React.useState<StopClockPeriod | undefined>(undefined);
  const [totalDays, setTotalDays] = React.useState<number>(0);
  const [phaseOption, setPhaseOption] = React.useState<PhaseOption>("phase1and2");
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  
  // New state for AI summary
  const [aiSummary, setAiSummary] = React.useState<string | null>(null);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = React.useState(false);
  const [aiSummaryError, setAiSummaryError] = React.useState<string | null>(null);
  
  // References for PDF export
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLDivElement>(null);
  const inputParamsRef = React.useRef<HTMLDivElement>(null);
  
  // New state for commitments offered feature
  const [commitmentsEnabled, setCommitmentsEnabled] = React.useState(false);
  const [commitmentPhase, setCommitmentPhase] = React.useState<CommitmentPhaseOption>("phase1");
  const [extensionDuration, setExtensionDuration] = React.useState<number>(10);

  // Secret feature event listener
  React.useEffect(() => {
    const handleSecretFeature = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { filingDate: newFilingDate, stopClockEnabled: newStopClockEnabled, 
              stopClockDate: newStopClockDate, stopClockDuration: newStopClockDuration } = customEvent.detail;
      
      // Set the values from the secret feature
      setFilingDate(newFilingDate);
      setStopClockEnabled(newStopClockEnabled);
      setStopClockDate(newStopClockDate);
      setStopClockDuration(newStopClockDuration);
    };

    // Add event listener
    document.addEventListener('secret-feature-triggered', handleSecretFeature);
    
    // Clean up
    return () => {
      document.removeEventListener('secret-feature-triggered', handleSecretFeature);
    };
  }, []);

  // Calculate results when inputs change
  React.useEffect(() => {
    if (!filingDate) {
      setResults([]);
      setTimelineEvents([]);
      setStopClockPeriod(undefined);
      setTotalDays(0);
      return;
    }

    // Get today's date for comparison
    const today = new Date();

    const newResults: ResultRow[] = [];
    const newTimelineEvents: TimelineEvent[] = [];
    let stopClockApplied = false;
    let stopClockEndDate: Date | undefined;
    let phase1ExtensionApplied = false;
    let phase1ExtensionDays = 0;

    // Add pre-assessment period if days > 0
    if (preAssessmentDays > 0) {
      const preAssessmentStartDate = subBusinessDays(filingDate, preAssessmentDays);
      
      // Add Pre-Assessment Start entry
      newResults.push({
        event: "Pre-Assessment Period Start",
        day: -preAssessmentDays,
        date: preAssessmentStartDate,
        dayOfWeek: format(preAssessmentStartDate, "EEEE"),
        isPreAssessment: true,
        isPast: preAssessmentStartDate <= today
      });

      newTimelineEvents.push({
        event: "Pre-Assessment Start",
        date: preAssessmentStartDate,
        isPreAssessment: true,
        day: -preAssessmentDays
      });
    }

    // Add filing date as first entry
    newResults.push({
      event: "Filing Date",
      day: 0,
      date: filingDate,
      dayOfWeek: format(filingDate, "EEEE"),
      isPast: filingDate <= today
    });

    newTimelineEvents.push({
      event: "Filing Date",
      date: filingDate,
      day: 0
    });

    // Select milestones based on phase option
    const selectedMilestones = phaseOption === "phase1" ? phase1Milestones : milestones;

    // Process each milestone
    Object.entries(selectedMilestones).forEach(([name, days]) => {
      let calculatedDate = calculateBusinessDate(filingDate, days, holidays);
      let adjustedDays = days;
      let extensionApplied = false;
      let extensionDays = 0;
      
      // Apply stop clock if enabled and milestone is after stop clock date
      if (stopClockEnabled && stopClockDate && calculatedDate >= stopClockDate) {
        // Add stop clock entry if not already added
        if (!stopClockApplied) {
          // Calculate business days from filing to stop clock
          let stopClockBusinessDays = 0;
          let tempDate = new Date(filingDate);
          
          while (tempDate < stopClockDate) {
            tempDate = addDays(tempDate, 1);
            if (!isWeekend(tempDate) && !isHoliday(tempDate, holidays)) {
              stopClockBusinessDays += 1;
            }
          }
          
          // Add Stop Clock Start entry
          newResults.push({
            event: "Stop Clock Start",
            day: stopClockBusinessDays,
            date: stopClockDate,
            dayOfWeek: format(stopClockDate, "EEEE"),
            isStopClock: true,
            stopClockDuration: stopClockDuration,
            isPast: stopClockDate <= today
          });

          newTimelineEvents.push({
            event: "STOP CLOCK APPLIED",
            date: stopClockDate,
            isStopClock: true,
            day: stopClockBusinessDays
          });
          
          stopClockApplied = true;
          
          // Calculate stop clock end date for timeline visualization
          stopClockEndDate = calculateBusinessDate(stopClockDate, stopClockDuration, holidays);
          
          // Add Stop Clock End entry
          if (stopClockEndDate) {
            newResults.push({
              event: "Stop Clock End",
              day: stopClockBusinessDays + stopClockDuration,
              date: stopClockEndDate,
              dayOfWeek: format(stopClockEndDate, "EEEE"),
              isStopClockEnd: true,
              isPast: stopClockEndDate <= today
            });
          }
        }
        
        // Recalculate with stop clock duration
        calculatedDate = calculateBusinessDate(calculatedDate, stopClockDuration, holidays);
        adjustedDays += stopClockDuration;
      }
      
      // Apply commitments extension if enabled
      if (commitmentsEnabled) {
        // For Phase 1 determination
        if (commitmentPhase === "phase1" && name === "Phase 1 determination") {
          // Extend the determination date by the extension duration
          calculatedDate = calculateBusinessDate(calculatedDate, extensionDuration, holidays);
          adjustedDays += extensionDuration;
          extensionApplied = true;
          extensionDays = extensionDuration;
          
          // Remember that Phase 1 was extended for subsequent milestones
          phase1ExtensionApplied = true;
          phase1ExtensionDays = extensionDuration;
        } 
        // For Phase 2 determination
        else if (commitmentPhase === "phase2" && name === "Phase 2 determination") {
          // Extend the determination date by the extension duration
          calculatedDate = calculateBusinessDate(calculatedDate, extensionDuration, holidays);
          adjustedDays += extensionDuration;
          extensionApplied = true;
          extensionDays = extensionDuration;
        }
        // For all milestones after Phase 1 determination if Phase 1 was extended
        else if (phase1ExtensionApplied && days > milestones["Phase 1 determination"]) {
          // Extend all subsequent milestones by the Phase 1 extension duration
          calculatedDate = calculateBusinessDate(calculatedDate, phase1ExtensionDays, holidays);
          adjustedDays += phase1ExtensionDays;
          extensionApplied = true;
          extensionDays = phase1ExtensionDays;
        }
      }
      
      // Check if this is a phase determination date
      const isPhaseDecision = name.includes("Phase 1 determination") || name.includes("Phase 2 determination");
      
      newResults.push({
        event: name,
        day: adjustedDays,
        date: calculatedDate,
        dayOfWeek: format(calculatedDate, "EEEE"),
        isPhaseDecision,
        extensionDays: extensionApplied ? extensionDays : undefined,
        isPast: calculatedDate <= today
      });

      newTimelineEvents.push({
        event: name,
        date: calculatedDate,
        isPhaseDecision,
        day: adjustedDays,
        extensionDays: extensionApplied ? extensionDays : undefined
      });
    });
    
    // Sort results by date to ensure chronological order
    newResults.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    setResults(newResults);
    setTimelineEvents(newTimelineEvents);
    
    // Set stop clock period for timeline visualization
    if (stopClockEnabled && stopClockDate && stopClockEndDate) {
      setStopClockPeriod({
        startDate: stopClockDate,
        endDate: stopClockEndDate,
        duration: stopClockDuration
      });
    } else {
      setStopClockPeriod(undefined);
    }

    // Calculate total days (pre-assessment + last milestone)
    if (newResults.length > 0) {
      const lastResult = newResults[newResults.length - 1];
      setTotalDays(preAssessmentDays + lastResult.day);
    }
  }, [filingDate, stopClockEnabled, stopClockDate, stopClockDuration, preAssessmentDays, phaseOption, commitmentsEnabled, commitmentPhase, extensionDuration]);

  // Function to generate PDF
  const generatePDF = async () => {
    if (!results.length) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      // Page 1: Timeline and Results Table
      if (timelineRef.current && tableRef.current) {
        // Capture timeline
        const timelineCanvas = await html2canvas(timelineRef.current, {
          scale: 2,
          logging: false,
          useCORS: true
        });
        
        const timelineImgData = timelineCanvas.toDataURL('image/png');
        
        // Add timeline to PDF (centered)
        const timelineImgWidth = 180; // mm, A4 width is 210mm
        const timelineImgHeight = (timelineCanvas.height * timelineImgWidth) / timelineCanvas.width;
        const timelineX = (210 - timelineImgWidth) / 2; // Center horizontally
        const timelineY = 20; // Top margin
        
        pdf.addImage(timelineImgData, 'PNG', timelineX, timelineY, timelineImgWidth, timelineImgHeight);
        
        // Capture results table
        const tableCanvas = await html2canvas(tableRef.current, {
          scale: 2,
          logging: false,
          useCORS: true
        });
        
        const tableImgData = tableCanvas.toDataURL('image/png');
        
        // Add table to PDF (centered)
        const tableImgWidth = 180; // mm
        const tableImgHeight = (tableCanvas.height * tableImgWidth) / tableCanvas.width;
        const tableX = (210 - tableImgWidth) / 2; // Center horizontally
        const tableY = timelineY + timelineImgHeight + 10; // Below timeline
        
        pdf.addImage(tableImgData, 'PNG', tableX, tableY, tableImgWidth, tableImgHeight);
      }
      
      // Page 2: Input Parameters - Create a custom formatted page instead of capturing the DOM
      pdf.addPage();
      
      // Set font styles
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      
      // Add title
      pdf.text("Input Parameters", 105, 20, { align: "center" });
      
      // Set font for parameter labels
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      
      // Starting position for parameters
      const startX = 30;
      let currentY = 40;
      const lineHeight = 10;
      
      // Function to add a parameter with label and value
      const addParameter = (label: string, value: string) => {
        pdf.setFont("helvetica", "bold");
        pdf.text(label + ":", startX, currentY);
        pdf.setFont("helvetica", "normal");
        pdf.text(value, startX + 80, currentY);
        currentY += lineHeight;
      };
      
      // Add all parameters
      addParameter("Transaction Complexity", phaseOption === "phase1" ? "Phase 1 Only" : "Phase 1 and Phase 2");
      
      if (filingDate) {
        addParameter("Filing Date", format(filingDate, "d MMMM yyyy"));
      } else {
        addParameter("Filing Date", "Not set");
      }
      
      addParameter("Pre-Assessment Days", preAssessmentDays.toString());
      
      // Add stop clock information if enabled
      addParameter("Clock Stopped", stopClockEnabled ? "Yes" : "No");
      
      if (stopClockEnabled) {
        currentY += 2; // Add a little extra space
        
        if (stopClockDate) {
          addParameter("  Stop Clock Start", format(stopClockDate, "d MMMM yyyy"));
        } else {
          addParameter("  Stop Clock Start", "Not set");
        }
        
        addParameter("  Stop Clock Duration", `${stopClockDuration} days`);
        
        currentY += 2; // Add a little extra space
      }
      
      // Add commitments information if enabled
      addParameter("Commitments Offered", commitmentsEnabled ? "Yes" : "No");
      
      if (commitmentsEnabled) {
        currentY += 2; // Add a little extra space
        
        addParameter("  Phase", commitmentPhase === "phase1" ? "Phase One" : "Phase Two");
        addParameter("  Extension Duration", `${extensionDuration} days`);
      }
      
      // Add total timeline days
      currentY += 5; // Add more space before total
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Total Timeline:", startX, currentY);
      pdf.text(`${totalDays} days`, startX + 80, currentY);
      
      // Save the PDF
      pdf.save('business-days-calculator.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // New function to generate PDF for AI summary
  const generatePDFForAI = async (): Promise<string | null> => {
    if (!results.length) return null;
    
    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      // Page 1: Timeline and Results Table
      if (timelineRef.current && tableRef.current) {
        // Capture timeline
        const timelineCanvas = await html2canvas(timelineRef.current, {
          scale: 2,
          logging: false,
          useCORS: true
        });
        
        const timelineImgData = timelineCanvas.toDataURL('image/png');
        
        // Add timeline to PDF (centered)
        const timelineImgWidth = 180; // mm, A4 width is 210mm
        const timelineImgHeight = (timelineCanvas.height * timelineImgWidth) / timelineCanvas.width;
        const timelineX = (210 - timelineImgWidth) / 2; // Center horizontally
        const timelineY = 20; // Top margin
        
        pdf.addImage(timelineImgData, 'PNG', timelineX, timelineY, timelineImgWidth, timelineImgHeight);
        
        // Capture results table
        const tableCanvas = await html2canvas(tableRef.current, {
          scale: 2,
          logging: false,
          useCORS: true
        });
        
        const tableImgData = tableCanvas.toDataURL('image/png');
        
        // Add table to PDF (centered)
        const tableImgWidth = 180; // mm
        const tableImgHeight = (tableCanvas.height * tableImgWidth) / tableCanvas.width;
        const tableX = (210 - tableImgWidth) / 2; // Center horizontally
        const tableY = timelineY + timelineImgHeight + 10; // Below timeline
        
        pdf.addImage(tableImgData, 'PNG', tableX, tableY, tableImgWidth, tableImgHeight);
      }
      
      // Page 2: Input Parameters - Create a custom formatted page instead of capturing the DOM
      pdf.addPage();
      
      // Set font styles
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      
      // Add title
      pdf.text("Input Parameters", 105, 20, { align: "center" });
      
      // Set font for parameter labels
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      
      // Starting position for parameters
      const startX = 30;
      let currentY = 40;
      const lineHeight = 10;
      
      // Function to add a parameter with label and value
      const addParameter = (label: string, value: string) => {
        pdf.setFont("helvetica", "bold");
        pdf.text(label + ":", startX, currentY);
        pdf.setFont("helvetica", "normal");
        pdf.text(value, startX + 80, currentY);
        currentY += lineHeight;
      };
      
      // Add all parameters
      addParameter("Transaction Complexity", phaseOption === "phase1" ? "Phase 1 Only" : "Phase 1 and Phase 2");
      
      if (filingDate) {
        addParameter("Filing Date", format(filingDate, "d MMMM yyyy"));
      } else {
        addParameter("Filing Date", "Not set");
      }
      
      addParameter("Pre-Assessment Days", preAssessmentDays.toString());
      
      // Add stop clock information if enabled
      addParameter("Clock Stopped", stopClockEnabled ? "Yes" : "No");
      
      if (stopClockEnabled) {
        currentY += 2; // Add a little extra space
        
        if (stopClockDate) {
          addParameter("  Stop Clock Start", format(stopClockDate, "d MMMM yyyy"));
        } else {
          addParameter("  Stop Clock Start", "Not set");
        }
        
        addParameter("  Stop Clock Duration", `${stopClockDuration} days`);
        
        currentY += 2; // Add a little extra space
      }
      
      // Add commitments information if enabled
      addParameter("Commitments Offered", commitmentsEnabled ? "Yes" : "No");
      
      if (commitmentsEnabled) {
        currentY += 2; // Add a little extra space
        
        addParameter("  Phase", commitmentPhase === "phase1" ? "Phase One" : "Phase Two");
        addParameter("  Extension Duration", `${extensionDuration} days`);
      }
      
      // Add total timeline days
      currentY += 5; // Add more space before total
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Total Timeline:", startX, currentY);
      pdf.text(`${totalDays} days`, startX + 80, currentY);
      
      // Convert PDF to base64
      const pdfBase64 = pdf.output('datauristring');
      // Extract the base64 part after the data URI prefix
      return pdfBase64.split(',')[1];
    } catch (error) {
      console.error('Error generating PDF for AI:', error);
      return null;
    }
  };

  // Function to generate AI summary
  const generateAiSummary = async () => {
    setIsGeneratingAiSummary(true);
    setAiSummaryError(null);
    
    try {
      // Generate PDF for AI
      const pdfBase64 = await generatePDFForAI();
      
      if (!pdfBase64) {
        throw new Error("Failed to generate PDF for AI analysis");
      }
      
      // Call Gemini API
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfBase64 }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate AI summary");
      }
      
      const data = await response.json();
      setAiSummary(data.summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummaryError((error as Error).message);
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  // Function to determine if today falls between two dates
  const isTodayBetween = (prevDate: Date, nextDate: Date) => {
    const today = new Date();
    return today > prevDate && today <= nextDate;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Input Controls (reduced to 1/4 width) */}
        <div className="lg:col-span-1" ref={inputParamsRef}>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Input Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phase Selection Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="phase-option">Anticipated Transaction Complexity</Label>
                <Select 
                  value={phaseOption} 
                  onValueChange={(value: string) => {
                    setPhaseOption(value as PhaseOption);
                    // If changing to Phase 1 Only and commitment phase is set to phase2, reset to phase1
                    if (value === "phase1" && commitmentPhase === "phase2") {
                      setCommitmentPhase("phase1");
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select phase option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phase1">Phase 1 Only</SelectItem>
                    <SelectItem value="phase1and2">Phase 1 and Phase 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filing Date Picker - Moved before Pre-Assessment Days */}
              <div className="space-y-2">
                <Label htmlFor="filing-date">Filing Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="filing-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filingDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filingDate ? format(filingDate, "PPP") : "Select filing date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filingDate}
                      onSelect={(date) => {
                        setFilingDate(date);
                        // Reset stop clock if it's before the new filing date
                        if (stopClockDate && date && stopClockDate < date) {
                          setStopClockDate(undefined);
                        }
                      }}
                      initialFocus
                      defaultMonth={filingDate || DEFAULT_CALENDAR_DATE}
                      disabled={(date) => isWeekend(date)} // Disable weekends
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Pre-Assessment Days - Moved after Filing Date */}
              <div className="space-y-2">
                <Label htmlFor="pre-assessment">Pre-Assessment Days</Label>
                <Input
                  id="pre-assessment"
                  type="number"
                  min="0"
                  value={preAssessmentDays}
                  onChange={(e) => setPreAssessmentDays(parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Stop Clock Controls - with added spacing */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="stop-clock" 
                    checked={stopClockEnabled}
                    onChange={(e) => {
                      setStopClockEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setStopClockDate(undefined);
                        setStopClockDuration(0);
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="stop-clock">Clock Stopped</Label>
                </div>

                {stopClockEnabled && (
                  <div className="space-y-4 pl-6 mt-2">
                    {/* Stop Clock Start Date */}
                    <div className="space-y-2">
                      <Label htmlFor="stop-clock-date">Stop Clock Start</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="stop-clock-date"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !stopClockDate && "text-muted-foreground"
                            )}
                            disabled={!filingDate}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {stopClockDate ? format(stopClockDate, "PPP") : "Select stop clock start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={stopClockDate}
                            onSelect={setStopClockDate}
                            disabled={(date) => 
                              !filingDate || date < filingDate || isWeekend(date) // Disable weekends and dates before filing
                            }
                            initialFocus
                            defaultMonth={stopClockDate || filingDate || DEFAULT_CALENDAR_DATE}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Stop Clock Duration */}
                    <div className="space-y-2">
                      <Label htmlFor="stop-clock-duration">Stop Clock Duration (days)</Label>
                      <Input
                        id="stop-clock-duration"
                        type="number"
                        min="0"
                        value={stopClockDuration}
                        onChange={(e) => setStopClockDuration(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Commitments Offered Controls */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="commitments-offered" 
                    checked={commitmentsEnabled}
                    onChange={(e) => {
                      setCommitmentsEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setExtensionDuration(10);
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="commitments-offered">Commitments Offered</Label>
                </div>

                {commitmentsEnabled && (
                  <div className="space-y-4 pl-6 mt-2">
                    {/* Phase in which commitment offered */}
                    <div className="space-y-2">
                      <Label htmlFor="commitment-phase">Phase in which commitments are offered</Label>
                      <Select 
                        value={commitmentPhase} 
                        onValueChange={(value: string) => setCommitmentPhase(value as CommitmentPhaseOption)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select phase" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phase1">Phase One</SelectItem>
                          {phaseOption === "phase1and2" && (
                            <SelectItem value="phase2">Phase Two</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Extension Duration */}
                    <div className="space-y-2">
                      <Label htmlFor="extension-duration">Duration of extension (1-15 days)</Label>
                      <Input
                        id="extension-duration"
                        type="number"
                        min="1"
                        max="15"
                        value={extensionDuration}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setExtensionDuration(Math.min(Math.max(value, 1), 15)); // Clamp between 1 and 15
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total Days Counter - Light Theme */}
          {results.length > 0 && (
            <>
              <Card className="border shadow-sm mb-6">
                <CardHeader className="pb-2 pt-6">
                  <CardTitle className="text-center text-lg">Total Timeline</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-6xl font-bold text-primary">{totalDays}</span>
                    <span className="text-sm mt-1 text-muted-foreground">days</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* AI Summary Card */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-2 pt-6">
                  <CardTitle className="text-center text-lg">AI Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6">
                  {!aiSummary && !isGeneratingAiSummary && !aiSummaryError && (
                    <div className="flex flex-col items-center justify-center">
                      <Button 
                        onClick={generateAiSummary}
                        className="mt-2"
                      >
                        Generate AI Summary
                      </Button>
                    </div>
                  )}
                  
                  {isGeneratingAiSummary && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-pulse text-center text-muted-foreground">
                        Generating summary...
                      </div>
                    </div>
                  )}
                  
                  {aiSummaryError && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-center text-red-500 text-sm">
                        {aiSummaryError}
                      </div>
                      <Button 
                        onClick={generateAiSummary}
                        className="mt-2"
                        variant="outline"
                        size="sm"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                  
                  {aiSummary && (
                    <div className="text-sm text-muted-foreground">
                      {aiSummary}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Right Column - Results (expanded to 3/4 width) */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Merger Regime Date Calculator</CardTitle>
              {results.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-1"
                >
                  <FileIcon className="h-4 w-4" />
                  {isGeneratingPDF ? "Generating..." : "Export PDF"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <div className="space-y-6">
                  {/* Timeline visualization */}
                  <div className="mb-6" ref={timelineRef}>
                    <h3 className="text-lg font-medium mb-4">Timeline Visualization</h3>
                    <div className="border rounded-md p-4">
                      <TimelineChart 
                        events={timelineEvents} 
                        stopClockPeriod={stopClockPeriod} 
                        preAssessmentDays={preAssessmentDays}
                      />
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="rounded-md border" ref={tableRef}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[400px]">Event</TableHead>
                          <TableHead>Day</TableHead>
                          <TableHead className="w-[180px]">Date</TableHead>
                          <TableHead>Day of Week</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((row, index) => {
                          // Check if today falls between this row and the next row
                          const isBeforeToday = row.isPast;
                          const nextRow = index < results.length - 1 ? results[index + 1] : null;
                          const isTodayAfterThis = nextRow ? isTodayBetween(row.date, nextRow.date) : false;
                          
                          return (
                            <React.Fragment key={index}>
                              <TableRow 
                                className={cn(
                                  row.isPreAssessment ? "text-purple-500 font-medium" : "",
                                  (row.isStopClock || row.isStopClockEnd) ? "text-red-500 font-medium" : "",
                                  row.isPhaseDecision ? "text-blue-500 font-medium" : "",
                                  isBeforeToday ? "opacity-60" : "" // Slightly dim past events
                                )}
                              >
                                <TableCell className="font-medium">
                                  {row.event}
                                  {row.isStopClock && row.stopClockDuration && ` (${row.stopClockDuration} days)`}
                                  {row.extensionDays && ` (extended by ${row.extensionDays} days due to commitment proposal)`}
                                </TableCell>
                                <TableCell>{row.day}</TableCell>
                                <TableCell>{format(row.date, "d MMMM yyyy")}</TableCell>
                                <TableCell>{row.dayOfWeek}</TableCell>
                              </TableRow>
                              
                              {/* Insert Today indicator row if today falls between this row and the next */}
                              {isTodayAfterThis && (
                                <TableRow className="h-0">
                                  <TableCell colSpan={4} className="p-0 relative">
                                    <div className="absolute w-full h-0 border-b border-yellow-300" style={{ width: 'calc(100% - 150px)' }}></div>
                                    <div className="absolute right-0 pr-4 -mt-[10px]">
                                      <span className="text-yellow-700 text-xs font-medium">Today: {format(new Date(), "d MMMM yyyy")}</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Please select a filing date to see the timeline
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 