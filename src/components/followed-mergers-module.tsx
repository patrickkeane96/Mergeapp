"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Bell, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Merger } from '@/types/merger';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/lib/contexts/NotificationsContext';
import { MergerDetailsModal } from '@/components/merger-details-modal';
import { generateTimelineEvents } from '@/lib/utils/merger-utils';

// Outcome configuration (for consistent colors and labels)
const outcomeConfig = {
  under_review: {
    label: "Under Review",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800"
  },
  cleared: {
    label: "Cleared",
    bgColor: "bg-green-100",
    textColor: "text-green-800"
  },
  blocked: {
    label: "Blocked",
    bgColor: "bg-red-100", 
    textColor: "text-red-800"
  },
  cleared_with_commitments: {
    label: "Cleared with Commitments",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-800"
  }
};

interface FollowedMergersModuleProps {
  mergers: Merger[];
  maxItems?: number;
}

export function FollowedMergersModule({ 
  mergers, 
  maxItems = 5
}: FollowedMergersModuleProps) {
  const { isMergerFollowed } = useNotifications();
  const [selectedMerger, setSelectedMerger] = useState<Merger | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  
  // Filter only followed mergers
  const followedMergers = mergers
    .filter(merger => isMergerFollowed(merger.id))
    .slice(0, maxItems);
  
  // Handle merger click to show details
  const handleMergerClick = (merger: Merger) => {
    setSelectedMerger(merger);
    setTimelineEvents(generateTimelineEvents(merger));
    setIsModalOpen(true);
  };
  
  // Handle modal close with animation
  const handleModalClose = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
    }, 200);
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Followed Mergers</CardTitle>
          <CardDescription>Updates on mergers you're following</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[450px] w-full relative">
          {followedMergers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No followed mergers</p>
              <p className="text-sm text-muted-foreground mt-1">
                Follow mergers to see updates here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {followedMergers.map((merger) => (
                <div 
                  key={merger.id} 
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleMergerClick(merger)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-primary mt-0.5">
                      {merger.hasNotifications ? (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold">{merger.name}</h4>
                        <div className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                          {format(merger.startDate, "MMM d, yyyy")}
                        </div>
                      </div>
                      
                      <p className="text-sm mt-1">
                        {merger.lastEvent ? merger.lastEvent : (merger.outcome === 'under_review' ? '' : outcomeConfig[merger.outcome].label)}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">                        
                        <Badge
                          className={cn(
                            "text-xs px-1.5 py-0.5",
                            outcomeConfig[merger.outcome].bgColor,
                            outcomeConfig[merger.outcome].textColor
                          )}
                        >
                          {outcomeConfig[merger.outcome].label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      {/* Merger Details Modal */}
      <MergerDetailsModal
        merger={selectedMerger}
        timelineEvents={timelineEvents}
        isOpen={isModalOpen || isModalClosing}
        onClose={handleModalClose}
      />
    </Card>
  );
} 