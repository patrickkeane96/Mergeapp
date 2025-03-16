"use client";

import React, { useState, useEffect } from 'react';
import { format, differenceInBusinessDays } from "date-fns";
import { X, Calendar, Tag, FileText, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CustomDialog,
  CustomDialogContent,
  CustomDialogHeader,
  CustomDialogTitle,
} from "@/components/ui/custom-dialog";
import { Merger, TimelineEvent } from '@/types/merger';
import { useNotifications } from '@/lib/contexts/NotificationsContext';
import { cn } from '@/lib/utils';
import { fetchMergerStatusHistory, MergerStatusHistoryEntry } from '@/lib/supabase/mergerUtils';
import { generateTimelineEvents } from '@/lib/utils/merger-utils';
import { UpdateMergerStatus } from './update-merger-status';
import { Loader2 } from 'lucide-react';
import { Timeline } from '@/components/ui/timeline';

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

interface MergerDetailsModalProps {
  merger: Merger | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MergerDetailsModal({ merger, isOpen, onClose }: MergerDetailsModalProps) {
  const { followMerger, unfollowMerger, isMergerFollowed, addNotification } = useNotifications();
  const [isClosing, setIsClosing] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [statusHistory, setStatusHistory] = useState<MergerStatusHistoryEntry[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Fetch status history when merger changes
  useEffect(() => {
    if (merger && isOpen) {
      setIsLoadingHistory(true);
      fetchMergerStatusHistory(merger.id)
        .then(history => {
          setStatusHistory(history);
          // Generate new timeline events based on status history
          const events = generateTimelineEvents(merger, history);
          setTimelineEvents(events);
        })
        .catch(error => {
          console.error('Error fetching merger status history:', error);
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
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

  const handleStatusUpdated = async () => {
    if (merger) {
      // Reload status history
      try {
        const history = await fetchMergerStatusHistory(merger.id);
        setStatusHistory(history);
        
        // Generate timeline events based on status history
        const events = generateTimelineEvents(merger, history);
        setTimelineEvents(events);
      } catch (error) {
        console.error('Error refreshing merger status history:', error);
      }
    }
  };

  return (
    <CustomDialog open={isOpen || isClosing} onOpenChange={(open) => !open && handleClose()}>
      <CustomDialogContent 
        className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0"
        showContent={showContent}
        onCloseClick={handleClose}
        onEscapeKeyDown={(e) => e.preventDefault()}
        forceMount
      >
        <CustomDialogHeader className="flex-shrink-0 p-6 pb-3">
          <CustomDialogTitle className="text-xl">Merger Details</CustomDialogTitle>
        </CustomDialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0">
          <div className="space-y-6">
            {/* Merger Header */}
            <div>
              <h3 className="text-2xl font-bold">{merger.target} / {merger.acquirer}</h3>
              <div className="flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-2">
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
                {/* Status update option removed for users */}
              </div>
            </div>
            
            {/* Merger Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Filing Date</p>
                    <p className="text-muted-foreground">
                      {format(merger.startDate, "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                
                {merger.endDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Decision Date</p>
                      <p className="text-muted-foreground">
                        {format(merger.endDate, "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Industry</p>
                    <p className="text-muted-foreground">{merger.industry}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Description</p>
                    <p className="text-muted-foreground">{merger.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Combined Timeline and Status History */}
            <Card>
              <CardHeader>
                <CardTitle>Merger Timeline</CardTitle>
                <CardDescription>
                  {isLoadingHistory 
                    ? "Loading timeline data..." 
                    : statusHistory.length > 0 
                      ? "Timeline based on actual status changes" 
                      : "Key events in the merger review process"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : timelineEvents.length > 0 ? (
                  <div className="space-y-6">
                    {/* Status History Summary */}
                    {statusHistory.length > 0 && (
                      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-2">Status History</h4>
                        <div className="space-y-2">
                          {statusHistory.map((entry, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "px-2 py-0.5",
                                    entry.status.includes('clear') ? "bg-green-50 text-green-700 border-green-200" :
                                    entry.status.includes('block') ? "bg-red-50 text-red-700 border-red-200" :
                                    "bg-blue-50 text-blue-700 border-blue-200"
                                  )}
                                >
                                  {entry.status.replace(/_/g, ' ')}
                                </Badge>
                                {entry.has_phase_2 && (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    Phase 2
                                  </Badge>
                                )}
                              </div>
                              <span className="text-muted-foreground">
                                {new Date(entry.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Timeline */}
                    <Timeline events={timelineEvents} />
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No timeline events available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t flex justify-end">
          <Button 
            variant={isFollowed ? "outline" : "default"}
            onClick={handleToggleFollow}
          >
            {isFollowed ? (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                Unfollow Merger
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Follow Merger
              </>
            )}
          </Button>
        </div>
      </CustomDialogContent>
    </CustomDialog>
  );
} 