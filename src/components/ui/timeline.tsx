"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { TimelineEvent } from '@/types/merger';
import { Badge } from '@/components/ui/badge';

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative space-y-4 ml-4 mt-4">
      {events.map((event, index) => (
        <div key={index} className="relative pb-4">
          {/* Timeline connector line */}
          {index < events.length - 1 && (
            <div className="absolute left-0 top-[7px] h-full w-[1px] bg-muted" />
          )}
          
          {/* Event dot */}
          <div className={cn(
            "absolute left-0 w-[6px] h-[6px] rounded-full -ml-[3px] ring-2 ring-background",
            event.completed ? (
              event.type === 'decision' ? (
                event.description?.toLowerCase().includes('cleared') ? "bg-green-600" :
                event.description?.toLowerCase().includes('blocked') ? "bg-red-600" :
                "bg-primary"
              ) : "bg-primary"
            ) : 
            event.upcoming ? "bg-orange-400" : "bg-muted"
          )} />
          
          {/* Event content */}
          <div className="pl-6">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{event.title}</h4>
              {event.completed && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Complete
                </Badge>
              )}
              {!event.completed && event.current && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Current
                </Badge>
              )}
              {event.upcoming && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  Upcoming
                </Badge>
              )}
            </div>
            {event.date && (
              <p className="text-xs text-muted-foreground">
                {new Date(event.date).toLocaleDateString()}
              </p>
            )}
            {event.description && (
              <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 