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
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, subMonths, addMonths, subBusinessDays, addBusinessDays, isAfter, isBefore, isEqual } from "date-fns";
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
  extensionDays?: number; // Add extension days property for commitments
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

  // Get today's date
  const today = new Date();

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Get the first and last dates
  const firstDate = sortedEvents[0].date;
  const lastDate = sortedEvents[sortedEvents.length - 1].date;
  
  // Use the sorted events directly without adding another pre-assessment event
  let allEvents = [...sortedEvents];
  
  // Get the actual first and last dates
  const actualFirstDate = allEvents[0].date;
  const actualLastDate = allEvents[allEvents.length - 1].date;
  
  // Add 10-day buffer before the first date and after the last date
  const extendedFirstDate = addDays(actualFirstDate, -10);
  const extendedLastDate = addDays(actualLastDate, 10);
  
  // Check if today falls within the timeline range
  const todayInRange = isAfter(today, extendedFirstDate) && isBefore(today, extendedLastDate);
  
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
  
  // Calculate position for today's line if in range
  const todayPos = todayInRange ? daysFromStart(today) / totalDays * (months.length - 1) : null;
  
  // Prepare data for Chart.js
  const labels = months.map(month => format(month, "MMM yyyy"));
  
  // Find filing date and last event for timeline segments
  const filingDateEvent = allEvents.find(event => event.event === "Filing Date");
  const preAssessmentEvent = allEvents.find(event => event.isPreAssessment);
  const filingDatePos = filingDateEvent ? daysFromStart(filingDateEvent.date) / totalDays * (labels.length - 1) : 0;
  const lastEventPos = daysFromStart(actualLastDate) / totalDays * (labels.length - 1);
  
  // Determine which events are in the past
  const isPastEvent = (event: TimelineEvent) => {
    return isBefore(event.date, today) || isEqual(event.date, today);
  };
  
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
        backgroundColor: allEvents.map(event => {
          // Base color based on event type
          const baseColor = event.isPhaseDecision ? "rgba(54, 162, 235, " : 
                           event.isStopClock ? "rgba(255, 99, 132, " : 
                           event.isPreAssessment ? "rgba(147, 112, 219, " : // Purple for pre-assessment
                           "rgba(75, 192, 192, ";
          
          // If today is in range and event is in the past, make it slightly transparent
          const opacity = (todayInRange && isPastEvent(event)) ? "0.5)" : "1)";
          
          return baseColor + opacity;
        }),
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
  if (preAssessmentEvent && filingDateEvent) {
    const preAssessmentPos = daysFromStart(preAssessmentEvent.date) / totalDays * (labels.length - 1);
    
    timelineData.datasets.push({
      label: "Pre-Assessment Period",
      data: [
        { x: preAssessmentPos, y: 1 },
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
      backgroundColor: todayInRange && isPastEvent({ date: stopClockPeriod.endDate, event: "Stop Clock End" }) 
        ? "rgba(255, 99, 132, 0.5)" 
        : "rgba(255, 99, 132, 1)",
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
    const isPast = todayInRange && isPastEvent(event);
    
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
      color: event.isPhaseDecision ? `rgba(54, 162, 235, ${isPast ? 0.5 : 1})` : 
             event.isStopClock ? `rgba(255, 99, 132, ${isPast ? 0.5 : 1})` :
             event.isPreAssessment ? `rgba(147, 112, 219, ${isPast ? 0.5 : 1})` : // Purple for pre-assessment
             `rgba(75, 192, 192, ${isPast ? 0.5 : 1})`,
      rotation: 45, // Angle the labels from bottom left to top right
      textAlign: 'center',
      padding: 5,
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
      borderColor: `rgba(150, 150, 150, ${isPast ? 0.15 : 0.3})`, // Fainter gray line for past events
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
        color: `rgba(100, 100, 100, ${isPast ? 0.4 : 0.8})`, // Fainter for past events
        rotation: 0,
        textAlign: 'center',
      };
    }
  });
  
  // Add day number for stop clock end point if available
  if (stopClockPeriod && stopClockPeriod.startDay !== undefined && stopClockPeriod.duration !== undefined) {
    const stopClockEndDay = stopClockPeriod.startDay + stopClockPeriod.duration;
    const stopClockEndPos = daysFromStart(stopClockPeriod.endDate) / totalDays * (labels.length - 1);
    const isStopClockEndPast = todayInRange && isPastEvent({ date: stopClockPeriod.endDate, event: "Stop Clock End" });
    
    annotations[`stop-clock-end-day`] = {
      type: 'label',
      xValue: stopClockEndPos,
      yValue: 0.9, // Below the dot
      content: `Day ${stopClockEndDay}`,
      font: {
        size: 9,
        weight: 'normal',
      },
      color: `rgba(100, 100, 100, ${isStopClockEndPast ? 0.4 : 0.8})`,
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
      borderColor: `rgba(150, 150, 150, ${isStopClockEndPast ? 0.15 : 0.3})`,
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
      color: `rgba(255, 99, 132, ${isStopClockEndPast ? 0.5 : 1})`,
      rotation: 45,
      textAlign: 'center',
      padding: 5,
      position: {
        x: 'center'
      },
      display: true,
      z: 10,
      offset: 0
    };
  }

  // Add today line annotation if today is within the timeline range
  if (todayInRange && todayPos !== null) {
    // Add vertical line for today
    annotations['today-line'] = {
      type: 'line',
      xMin: todayPos,
      xMax: todayPos,
      yMin: 0.75, // Start from below the timeline
      yMax: 1.25, // End above the timeline
      borderColor: 'rgba(255, 215, 0, 1)', // Yellow color
      borderWidth: 2,
      borderDash: [5, 5], // Dotted line
      z: 15 // Higher z-index to appear above other elements
    };
    
    // Add "Today" label at the bottom of the line
    annotations['today-label'] = {
      type: 'label',
      xValue: todayPos,
      yValue: 0.7, // Position below the timeline
      content: "Today",
      font: {
        size: 10,
        weight: 'bold',
      },
      color: 'rgba(255, 215, 0, 1)', // Yellow color
      rotation: 0,
      textAlign: 'center',
      padding: 5,
      z: 15
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
              // Add extension information if applicable
              if (event.extensionDays) {
                label += ` - Extended by ${event.extensionDays} days due to remedy proposal`;
              }
              // Add "Past Event" indicator if applicable
              if (todayInRange && isPastEvent(event)) {
                label += " (Past Event)";
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
              // Add "Past Event" indicator if applicable
              if (todayInRange && isPastEvent({ date: stopClockPeriod.endDate, event: "Stop Clock End" })) {
                label += " (Past Event)";
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