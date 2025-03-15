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
    color: "#059669", // Different shade of green
    barColor: "#059669",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-800"
  }
};

interface MergerDetailsModalProps {
  merger: Merger | null;
  timelineEvents: TimelineEvent[];
  isOpen: boolean;
  onClose: () => void;
}

export function MergerDetailsModal({ merger, timelineEvents, isOpen, onClose }: MergerDetailsModalProps) {
  const { followMerger, unfollowMerger, isMergerFollowed, addNotification } = useNotifications();
  const [isClosing, setIsClosing] = useState(false);
  const [showContent, setShowContent] = useState(false);
  
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
        message: `You're no longer following ${merger.name}.`,
        mergerId: merger.id,
        industry: merger.industry,
      });
    } else {
      followMerger(merger.id);
      
      // Add notification about following
      addNotification({
        type: 'status_change',
        title: 'Following Merger',
        message: `You're now following ${merger.name}. You'll receive updates about status changes.`,
        mergerId: merger.id,
        industry: merger.industry,
      });
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
        
        <ScrollArea className="flex-1 max-h-[calc(90vh-8rem)]">
          <div className="space-y-6 p-6 pt-0">
            {/* Merger Header */}
            <div>
              <h3 className="text-2xl font-bold">{merger.name}</h3>
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
                <span className="text-muted-foreground">
                  {merger.endDate
                    ? `Completed in ${differenceInBusinessDays(
                        merger.endDate,
                        merger.startDate
                      )} business days`
                    : "Ongoing review"}
                </span>
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
            
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Review Timeline</CardTitle>
                <CardDescription>Key events in the merger review process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 border-l border-solid border-border h-full min-h-[200px]">
                  {timelineEvents.map((event) => (
                    <div key={event.id} className="mb-6 last:mb-0">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-1.5 mt-1.5" />
                      <h4 className="font-medium">{event.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(event.date, "MMMM d, yyyy")}
                      </p>
                      <p className="mt-1 text-sm">{event.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        
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