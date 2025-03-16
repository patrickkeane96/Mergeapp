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
    <div className="relative space-y-4 ml-4 mt-2">
      {events.map((event, index) => (
        <div key={index} className="relative pb-4">
          {/* Timeline connector line */}
          {index < events.length - 1 && (
            <div className="absolute left-0 top-2 bottom-0 w-px bg-border -ml-2" />
          )}
          
          {/* Event dot */}
          <div className={cn(
            "absolute left-0 w-4 h-4 rounded-full -ml-2 -mt-1 border-2 border-background",
            event.completed ? "bg-primary" : 
            event.upcoming ? "bg-orange-400" : "bg-muted"
          )} />
          
          {/* Event content */}
          <div className="pl-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{event.title}</h4>
              {event.completed && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Complete
                </Badge>
              )}
              {!event.completed && event.current && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Current
                </Badge>
              )}
              {event.upcoming && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
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
              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 