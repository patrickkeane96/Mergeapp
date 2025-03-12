"use client";

import React from "react";
import { format, differenceInDays, addDays } from "date-fns";

// Type for timeline events
export type TimelineEvent = {
  event: string;
  date: Date;
  isStopClock?: boolean;
  isPhaseDecision?: boolean;
  isPreAssessment?: boolean;
  day?: number; // Add day property
  extensionDays?: number; // Add extension days property for commitments
  isActualDate?: boolean; // New property to indicate actual dates
};

// Type for stop clock period
export type StopClockPeriod = {
  startDate: Date;
  endDate: Date;
  duration: number;
};

type TimelineChartProps = {
  events: TimelineEvent[];
  stopClockPeriod?: StopClockPeriod;
  preAssessmentDays: number;
};

export function TimelineChart({ events, stopClockPeriod, preAssessmentDays }: TimelineChartProps) {
  if (!events.length) return null;

  // Find the earliest and latest dates in the timeline
  const allEvents = [...events];
  
  // Sort events by date
  allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Find the pre-assessment event if it exists
  const preAssessmentEvent = allEvents.find(event => event.isPreAssessment);
  
  // Get the first and last dates from the sorted events
  const firstDate = preAssessmentEvent ? preAssessmentEvent.date : allEvents[0]?.date;
  const lastDate = allEvents[allEvents.length - 1]?.date;
  
  // Add buffer days before and after
  const extendedFirstDate = firstDate ? addDays(firstDate, -10) : new Date();
  const extendedLastDate = lastDate ? addDays(lastDate, 10) : addDays(new Date(), 30);
  
  // Calculate the total number of days in the timeline
  const totalDays = differenceInDays(extendedLastDate, extendedFirstDate);
  
  // Get the current date for the "Today" indicator
  const today = new Date();
  const isTodayInRange = today >= extendedFirstDate && today <= extendedLastDate;
  const todayPosition = isTodayInRange 
    ? (differenceInDays(today, extendedFirstDate) / totalDays) * 100 
    : null;
  
  // Check if events are in the past (before today)
  const isPastEvent = (date: Date) => {
    return date < today;
  };

  return (
    <div className="w-full h-[200px] relative">
      {/* Main horizontal line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300"></div>
      
      {/* Today indicator (if within range) */}
      {isTodayInRange && (
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 w-0.5 h-[100px] border-l-2 border-dashed border-yellow-500 z-10"
          style={{ left: `${todayPosition}%` }}
        >
          <span className="absolute bottom-[-25px] left-[-15px] text-xs font-medium text-yellow-600">Today</span>
        </div>
      )}
      
      {/* Pre-assessment period (if applicable) */}
      {preAssessmentEvent && (
        <div 
          className="absolute top-1/2 h-0.5 bg-purple-500"
          style={{
            left: `${(differenceInDays(preAssessmentEvent.date, extendedFirstDate) / totalDays) * 100}%`,
            right: `${100 - (differenceInDays(allEvents[0].date, extendedFirstDate) / totalDays) * 100}%`,
          }}
        ></div>
      )}
      
      {/* Stop clock period (if applicable) */}
      {stopClockPeriod && (
        <div 
          className="absolute top-1/2 h-0.5 bg-red-500"
          style={{
            left: `${(differenceInDays(stopClockPeriod.startDate, extendedFirstDate) / totalDays) * 100}%`,
            width: `${(differenceInDays(stopClockPeriod.endDate, stopClockPeriod.startDate) / totalDays) * 100}%`,
          }}
        ></div>
      )}
      
      {/* Event markers */}
      {allEvents.map((event, index) => {
        const position = (differenceInDays(event.date, extendedFirstDate) / totalDays) * 100;
        const isPast = isPastEvent(event.date);
        
        return (
          <div 
            key={index} 
            className="absolute"
            style={{ left: `${position}%`, top: '50%' }}
          >
            {/* Event dot */}
            <div 
              className={`w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                event.isPhaseDecision 
                  ? 'bg-blue-500' 
                  : event.isStopClock 
                    ? 'bg-red-500' 
                    : event.isPreAssessment 
                      ? 'bg-purple-500' 
                      : 'bg-gray-500'
              } ${isPast ? 'opacity-50' : ''}`}
            ></div>
            
            {/* Day number */}
            <div 
              className={`absolute top-[-30px] left-[-10px] text-xs font-medium ${isPast ? 'text-gray-400' : 'text-gray-700'}`}
            >
              Day {event.day}
            </div>
            
            {/* Event label */}
            <div 
              className={`absolute top-[15px] left-[-5px] text-xs font-medium transform ${
                index % 2 === 0 ? 'rotate-45 origin-left' : 'rotate-45 origin-left'
              } ${
                event.isPhaseDecision 
                  ? 'text-blue-500' 
                  : event.isStopClock 
                    ? 'text-red-500' 
                    : event.isPreAssessment 
                      ? 'text-purple-500' 
                      : 'text-gray-700'
              } ${isPast ? 'opacity-50' : ''}`}
            >
              {event.event}
              {event.isActualDate && '*'}
              {event.extensionDays && ` (+${event.extensionDays})`}
            </div>
          </div>
        );
      })}
      
      {/* Date labels */}
      <div className="absolute bottom-0 left-0 text-xs text-gray-500">
        {format(extendedFirstDate, 'd MMM yyyy')}
      </div>
      <div className="absolute bottom-0 right-0 text-xs text-gray-500">
        {format(extendedLastDate, 'd MMM yyyy')}
      </div>
    </div>
  );
} 