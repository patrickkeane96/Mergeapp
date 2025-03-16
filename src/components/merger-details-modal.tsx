"use client";

import React, { useState, useEffect } from 'react';
import { format, differenceInBusinessDays } from "date-fns";
import { X, Calendar, Tag, FileText, StarIcon, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CustomDialog,
  CustomDialogContent,
  CustomDialogHeader,
  CustomDialogTitle,
  CustomDialogClose,
} from "@/components/ui/custom-dialog";
import { Merger, TimelineEvent } from '@/types/merger';
import { useNotifications } from '@/lib/contexts/NotificationsContext';
import { cn } from '@/lib/utils';
import { fetchMergerStatusHistory, MergerStatusHistoryEntry } from '@/lib/supabase/mergerUtils';
import { generateTimelineEvents } from '@/lib/utils/merger-utils';
import { Loader2 } from 'lucide-react';
import { Timeline } from '@/components/ui/timeline';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FileIcon, Download } from 'lucide-react';

// Outcome configuration (for consistent colors and labels)
const outcomeConfig = {
  under_review: {
    label: "Under Review",
    color: "#FBBF24", // Yellow
    barColor: "#FBBF24",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800"
  },
  cleared: {
    label: "Cleared",
    color: "#10B981", // Green
    barColor: "#10B981",
    bgColor: "bg-green-100",
    textColor: "text-green-800"
  },
  blocked: {
    label: "Blocked",
    color: "#EF4444", // Red
    barColor: "#EF4444",
    bgColor: "bg-red-100", 
    textColor: "text-red-800"
  },
  cleared_with_commitments: {
    label: "Cleared with Commitments",
    color: "#3B82F6", // Blue
    barColor: "#3B82F6",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800"
  }
};

// Sample documents for display
const documents = [
  { id: '1', title: 'Initial Filing Documentation', date: new Date(2023, 5, 15) },
  { id: '2', title: 'Market Analysis Report', date: new Date(2023, 6, 10) },
  { id: '3', title: 'Competitive Assessment', date: new Date(2023, 7, 2) },
  { id: '4', title: 'Remedies Proposal', date: new Date(2023, 8, 5) },
];

// Sample key dates
const keyDates = [
  { id: '1', title: 'Phase 1 Deadline', date: new Date(2023, 8, 15) },
  { id: '2', title: 'Committee Review', date: new Date(2023, 9, 1) },
  { id: '3', title: 'Final Decision Due', date: new Date(2023, 10, 15) },
];

// Sample key people
const keyPeople = [
  { id: '1', name: 'Sarah Johnson', role: 'Lead Case Officer', avatar: '' },
  { id: '2', name: 'Michael Chen', role: 'Economic Analyst', avatar: '' },
  { id: '3', name: 'Jessica Williams', role: 'Legal Counsel', avatar: '' },
];

interface MergerDetailsModalProps {
  merger: Merger | null;
  isOpen: boolean;
  onClose: () => void;
  timelineEvents?: TimelineEvent[];
}

export function MergerDetailsModal({ merger, isOpen, onClose, timelineEvents: initialTimelineEvents }: MergerDetailsModalProps) {
  const { followMerger, unfollowMerger, isMergerFollowed, addNotification } = useNotifications();
  const [isClosing, setIsClosing] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialTimelineEvents || []);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Fetch timeline events when merger changes
  useEffect(() => {
    if (merger && isOpen) {
      setIsLoadingHistory(true);
      
      // Generate timeline events directly without fetching status history
      const events = generateTimelineEvents(merger);
      setTimelineEvents(events);
      setIsLoadingHistory(false);
    }
  }, [merger, isOpen]);
  
  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      // Small delay to ensure the modal is visible before showing content
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);
  
  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setShowContent(false);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };
  
  if (!merger) return null;
  
  const isFollowed = isMergerFollowed(merger.id);

  const handleToggleFollow = () => {
    if (isFollowed) {
      unfollowMerger(merger.id);
      
      // Add notification about unfollowing
      addNotification({
        type: 'status_change',
        title: 'Unfollowed Merger',
        message: `You're no longer following ${merger.target} / ${merger.acquirer}.`,
        mergerId: merger.id,
        industry: merger.industry,
      });
    } else {
      followMerger(merger.id);
      
      // Add notification about following
      addNotification({
        type: 'status_change',
        title: 'Following Merger',
        message: `You're now following ${merger.target} / ${merger.acquirer}. You'll receive updates about status changes.`,
        mergerId: merger.id,
        industry: merger.industry,
      });
    }
  };

  return (
    <CustomDialog open={isOpen || isClosing} onOpenChange={(open) => !open && handleClose()}>
      <CustomDialogContent 
        className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden p-0"
        showContent={showContent}
        onCloseClick={handleClose}
        onEscapeKeyDown={(e) => e.preventDefault()}
        forceMount
      >
        <CustomDialogHeader className="flex-shrink-0 p-6 pb-3">
          <div className="flex justify-between items-center w-full">
            <CustomDialogTitle className="text-xl">Merger Details</CustomDialogTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFollow}
                className={cn(
                  "min-w-24",
                  isFollowed
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : ""
                )}
              >
                {isFollowed ? (
                  <>
                    <StarIcon className="mr-2 h-4 w-4 fill-primary" />
                    Following
                  </>
                ) : (
                  <>
                    <StarIcon className="mr-2 h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
              
              <X 
                className="h-4 w-4 cursor-pointer opacity-70 hover:opacity-100" 
                onClick={handleClose}
              />
            </div>
          </div>
        </CustomDialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0">
          <div className="space-y-6">
            {/* Merger Header */}
            <div>
              <h3 className="text-2xl font-bold">{merger.target} / {merger.acquirer}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  className={cn(
                    "px-2 py-1",
                    outcomeConfig[merger.outcome].bgColor,
                    outcomeConfig[merger.outcome].textColor
                  )}
                >
                  {outcomeConfig[merger.outcome].label}
                </Badge>
                {merger.endDate && (
                  <span className="text-muted-foreground">
                    Completed in {differenceInBusinessDays(
                      merger.endDate,
                      merger.startDate
                    )} business days
                  </span>
                )}
              </div>
            </div>
            
            {/* Main content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left column - details */}
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Merger Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-1">Acquirer</h4>
                        <p>{merger.acquirer}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-1">Target</h4>
                        <p>{merger.target}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-1">Industry</h4>
                        <p>{merger.industry}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-1">Filing Date</h4>
                        <p>{format(merger.startDate, "MMMM d, yyyy")}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Description</h4>
                      <p className="text-sm">{merger.description}</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Timeline */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Timeline</CardTitle>
                    <CardDescription>Key events and milestones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <Timeline events={timelineEvents} />
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Right column - documents */}
              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Related files and reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="rounded-md bg-primary/10 p-2">
                            <FileIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(doc.date, "MMM d, yyyy")}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </CustomDialogContent>
    </CustomDialog>
  );
} 