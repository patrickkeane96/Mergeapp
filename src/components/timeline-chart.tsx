"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ChartOptions,
  ChartData,
  ScatterDataPoint,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, subMonths, addMonths, subBusinessDays, addBusinessDays } from "date-fns";
import annotationPlugin from 'chartjs-plugin-annotation';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

// Type for timeline events
export type TimelineEvent = {
  event: string;
  date: Date;
  isStopClock?: boolean;
  isPhaseDecision?: boolean;
  isPreAssessment?: boolean;
  day?: number; // Add day property
};

// Type for stop clock period
export type StopClockPeriod = {
  startDate: Date;
  endDate: Date;
  duration?: number; // Add duration property
  startDay?: number; // Day number when stop clock starts
};

interface TimelineChartProps {
  events: TimelineEvent[];
  stopClockPeriod?: StopClockPeriod;
  preAssessmentDays: number;
}

// Helper function to get abbreviated event name
function getAbbreviatedEventName(eventName: string): string {
  if (eventName === "Filing Date") return "Filing Date";
  if (eventName === "STOP CLOCK APPLIED") return "Stop Clock Start";
  if (eventName === "Pre-Assessment Start") return "Pre-Assessment";
  if (eventName.includes("Earliest date ACCC can clear")) return "Earliest Decision";
  if (eventName.includes("Final date for Phase 1 remedy")) return "P1 Remedy Deadline";
  if (eventName.includes("Phase 1 determination")) return "Phase One Deadline";
  if (eventName.includes("ACCC issues notice of competition")) return "NOCC";
  if (eventName.includes("Response to notice of competition")) return "Response to NOCC";
  if (eventName.includes("Final date for Phase 2 remedy")) return "P2 Remedy Deadline";
  if (eventName.includes("Final date to provide information")) return "Information Deadline";
  if (eventName.includes("Phase 2 determination")) return "Phase Two Deadline";
  return eventName.split(' ').slice(0, 2).join(' ');
}

export function TimelineChart({ events, stopClockPeriod, preAssessmentDays }: TimelineChartProps) {
  if (!events.length) return null;

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Get the first and last dates
  const firstDate = sortedEvents[0].date;
  const lastDate = sortedEvents[sortedEvents.length - 1].date;
  
  // Add pre-assessment start date if preAssessmentDays > 0
  let preAssessmentStartDate: Date | null = null;
  let allEvents = [...sortedEvents];
  
  if (preAssessmentDays > 0 && firstDate) {
    // Calculate pre-assessment start date (business days before filing date)
    preAssessmentStartDate = subBusinessDays(firstDate, preAssessmentDays);
    
    // Add pre-assessment start event
    allEvents.unshift({
      event: "Pre-Assessment Start",
      date: preAssessmentStartDate,
      isPreAssessment: true,
      day: -preAssessmentDays
    });
  }
  
  // Get the actual first and last dates after adding pre-assessment
  const actualFirstDate = allEvents[0].date;
  const actualLastDate = allEvents[allEvents.length - 1].date;
  
  // Add 10-day buffer before the first date and after the last date
  const extendedFirstDate = addDays(actualFirstDate, -10);
  const extendedLastDate = addDays(actualLastDate, 10);
  
  // Generate months for x-axis
  const months: Date[] = [];
  let currentMonth = startOfMonth(extendedFirstDate);
  const lastMonth = endOfMonth(extendedLastDate);
  
  while (currentMonth <= lastMonth) {
    months.push(currentMonth);
    currentMonth = startOfMonth(addDays(currentMonth, 32)); // Move to next month
  }
  
  // Calculate days from first date for positioning
  const daysFromStart = (date: Date) => differenceInDays(date, extendedFirstDate);
  const totalDays = differenceInDays(extendedLastDate, extendedFirstDate);
  
  // Prepare data for Chart.js
  const labels = months.map(month => format(month, "MMM yyyy"));
  
  // Find filing date and last event for timeline segments
  const filingDateEvent = allEvents.find(event => event.event === "Filing Date");
  const filingDatePos = filingDateEvent ? daysFromStart(filingDateEvent.date) / totalDays * (labels.length - 1) : 0;
  const lastEventPos = daysFromStart(actualLastDate) / totalDays * (labels.length - 1);
  
  // Create dataset for the timeline
  const timelineData: ChartData<"line"> = {
    labels,
    datasets: [
      // Main timeline (green line from filing date to last event)
      {
        label: "Timeline",
        data: [
          { x: filingDatePos, y: 1 },
          { x: lastEventPos, y: 1 }
        ],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        fill: false,
      },
      // Event points
      {
        label: "Events",
        data: allEvents.map(event => ({
          x: daysFromStart(event.date) / totalDays * (labels.length - 1),
          y: 1,
        })),
        backgroundColor: allEvents.map(event => 
          event.isPhaseDecision ? "rgba(54, 162, 235, 1)" : 
          event.isStopClock ? "rgba(255, 99, 132, 1)" : 
          event.isPreAssessment ? "rgba(147, 112, 219, 1)" : // Purple for pre-assessment
          "rgba(75, 192, 192, 1)"
        ),
        borderColor: "rgba(255, 255, 255, 1)",
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: "circle",
        showLine: false,
      },
    ],
  };

  // Add pre-assessment line if applicable
  if (preAssessmentStartDate && filingDateEvent) {
    const preAssessmentStartPos = daysFromStart(preAssessmentStartDate) / totalDays * (labels.length - 1);
    
    timelineData.datasets.push({
      label: "Pre-Assessment Period",
      data: [
        { x: preAssessmentStartPos, y: 1 },
        { x: filingDatePos, y: 1 }
      ],
      borderColor: "rgba(147, 112, 219, 1)", // Purple for pre-assessment
      backgroundColor: "rgba(147, 112, 219, 0.2)",
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
    });
  }

  // Add stop clock period if available
  if (stopClockPeriod) {
    const stopClockStartPos = daysFromStart(stopClockPeriod.startDate) / totalDays * (labels.length - 1);
    const stopClockEndPos = daysFromStart(stopClockPeriod.endDate) / totalDays * (labels.length - 1);
    
    // Find the stop clock start event to get its day number
    const stopClockStartEvent = allEvents.find(event => 
      event.isStopClock && event.date.getTime() === stopClockPeriod.startDate.getTime()
    );
    
    // Calculate the stop clock end day number
    const stopClockEndDay = stopClockStartEvent?.day !== undefined && stopClockPeriod.duration !== undefined
      ? stopClockStartEvent.day + stopClockPeriod.duration
      : undefined;
    
    // Add stop clock period line
    timelineData.datasets.push({
      label: "Stop Clock Period",
      data: [
        { x: stopClockStartPos, y: 1 },
        { x: stopClockEndPos, y: 1 },
      ],
      backgroundColor: "rgba(255, 99, 132, 0.5)",
      borderColor: "rgba(255, 99, 132, 1)",
      borderWidth: 8,
      pointRadius: 0,
      fill: false,
    });
    
    // Add stop clock end point
    timelineData.datasets.push({
      label: "Stop Clock End",
      data: [
        { x: stopClockEndPos, y: 1 },
      ],
      backgroundColor: "rgba(255, 99, 132, 1)",
      borderColor: "rgba(255, 255, 255, 1)",
      borderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointStyle: "circle",
      showLine: false,
    });
    
    // Store the stop clock end day for annotation
    stopClockPeriod.startDay = stopClockStartEvent?.day;
  }

  // Prepare annotations for event labels and connecting lines
  const annotations: any = {};
  
  // Add event labels and connecting lines
  allEvents.forEach((event, index) => {
    const xPos = daysFromStart(event.date) / totalDays * (labels.length - 1);
    const abbrevName = getAbbreviatedEventName(event.event);
    
    // Add label annotation above the point (event name)
    annotations[`label-${index}`] = {
      type: 'label',
      xValue: xPos,
      yValue: 1.2,
      content: abbrevName,
      font: {
        size: 10,
        weight: event.isPhaseDecision ? 'bold' : 'normal',
      },
      color: event.isPhaseDecision ? 'rgba(54, 162, 235, 1)' : 
             event.isStopClock ? 'rgba(255, 99, 132, 1)' :
             event.isPreAssessment ? 'rgba(147, 112, 219, 1)' : // Purple for pre-assessment
             "rgba(75, 192, 192, 1)",
      rotation: -45, // Angle the labels from bottom right to top left
      textAlign: 'center',
      padding: 0,
      position: {
        x: 'center'
      },
      display: true,
      z: 10,
      offset: 0
    };
    
    // Add connecting line between label and dot
    annotations[`connect-${index}`] = {
      type: 'line',
      xMin: xPos,
      xMax: xPos,
      yMin: 1,
      yMax: 1.2,
      borderColor: 'rgba(150, 150, 150, 0.3)', // Faint gray line
      borderWidth: 1,
      borderDash: [2, 2],
      z: 5
    };
    
    // Add day number below the point
    if (event.day !== undefined) {
      annotations[`day-${index}`] = {
        type: 'label',
        xValue: xPos,
        yValue: 0.9, // Move closer to the dot
        content: `Day ${event.day}`,
        font: {
          size: 9,
          weight: 'normal',
        },
        color: 'rgba(100, 100, 100, 0.8)',
        rotation: 0,
        textAlign: 'center',
      };
    }
  });
  
  // Add day number for stop clock end point if available
  if (stopClockPeriod && stopClockPeriod.startDay !== undefined && stopClockPeriod.duration !== undefined) {
    const stopClockEndDay = stopClockPeriod.startDay + stopClockPeriod.duration;
    const stopClockEndPos = daysFromStart(stopClockPeriod.endDate) / totalDays * (labels.length - 1);
    
    annotations[`stop-clock-end-day`] = {
      type: 'label',
      xValue: stopClockEndPos,
      yValue: 0.9, // Below the dot
      content: `Day ${stopClockEndDay}`,
      font: {
        size: 9,
        weight: 'normal',
      },
      color: 'rgba(100, 100, 100, 0.8)',
      rotation: 0,
      textAlign: 'center',
    };
    
    // Add connecting line for stop clock end label
    annotations[`connect-stop-clock-end`] = {
      type: 'line',
      xMin: stopClockEndPos,
      xMax: stopClockEndPos,
      yMin: 1,
      yMax: 1.2,
      borderColor: 'rgba(150, 150, 150, 0.3)', // Faint gray line
      borderWidth: 1,
      borderDash: [2, 2],
      z: 5
    };
    
    // Add label for stop clock end
    annotations[`label-stop-clock-end`] = {
      type: 'label',
      xValue: stopClockEndPos,
      yValue: 1.2,
      content: "Stop Clock End",
      font: {
        size: 10,
        weight: 'normal',
      },
      color: 'rgba(255, 99, 132, 1)',
      rotation: -45,
      textAlign: 'center',
      padding: 0,
      position: {
        x: 'center'
      },
      display: true,
      z: 10,
      offset: 0
    };
  }

  // Chart options
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: labels.length - 1,
        ticks: {
          callback: function(value) {
            return labels[Math.round(Number(value))];
          },
          maxRotation: 0, // No rotation for month labels
          minRotation: 0,
          align: 'center', // Center the labels under the grid lines
        },
        grid: {
          display: true,
          drawOnChartArea: true,
          drawTicks: true,
        },
        title: {
          display: false, // Remove "Timeline" text
        },
      },
      y: {
        display: false,
        min: 0.5,
        max: 1.5,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: function(context) {
            const dataIndex = context[0].dataIndex;
            const datasetIndex = context[0].datasetIndex;
            
            if (datasetIndex === 1) { // Events dataset
              return allEvents[dataIndex].event;
            } else if (datasetIndex === 4 && stopClockPeriod) { // Stop Clock End dataset
              return "Stop Clock End";
            }
            return "";
          },
          label: function(context) {
            const dataIndex = context.dataIndex;
            const datasetIndex = context.datasetIndex;
            
            if (datasetIndex === 1) { // Events dataset
              const event = allEvents[dataIndex];
              let label = format(event.date, "d MMMM yyyy");
              if (event.day !== undefined) {
                label += ` (Day ${event.day})`;
              }
              return label;
            } else if (datasetIndex === 4 && stopClockPeriod) { // Stop Clock End dataset
              const stopClockEndDay = stopClockPeriod.startDay !== undefined && stopClockPeriod.duration !== undefined
                ? stopClockPeriod.startDay + stopClockPeriod.duration
                : undefined;
              
              let label = format(stopClockPeriod.endDate, "d MMMM yyyy");
              if (stopClockEndDay !== undefined) {
                label += ` (Day ${stopClockEndDay})`;
              }
              return label;
            }
            return "";
          },
        },
      },
      legend: {
        display: false,
      },
      annotation: {
        annotations: annotations
      }
    },
  };

  return (
    <div className="h-80 w-full">
      <Line data={timelineData} options={options} />
    </div>
  );
} 