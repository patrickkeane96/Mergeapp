"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronRight, Bell, Clock, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Notification } from '@/lib/contexts/NotificationsContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Merger } from '@/types/merger';
import { MergerDetailsModal } from '@/components/merger-details-modal';
import { useNotifications } from '@/lib/contexts/NotificationsContext';
import { generateTimelineEvents } from '@/lib/utils/merger-utils';

// Notification type icons
const notificationIcons = {
  status_change: <AlertCircle className="h-5 w-5" />,
  filing_update: <FileText className="h-5 w-5" />,
  commitment_update: <FileText className="h-5 w-5" />,
  nocc_issued: <AlertCircle className="h-5 w-5" />,
  decision: <CheckCircle className="h-5 w-5" />,
  new_merger: <FileText className="h-5 w-5" />,
};

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

interface NewsModuleProps {
  notifications: Notification[];
  maxItems?: number;
}

export function NewsModule({ 
  notifications, 
  maxItems = 5
}: NewsModuleProps) {
  const { mergers, isMergerFollowed } = useNotifications();
  const [selectedMerger, setSelectedMerger] = useState<Merger | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  
  // Filter out notifications about following/unfollowing mergers
  const filteredNotifications = notifications
    .filter(notification => !(
      notification.type === 'status_change' && 
      (notification.title.includes('Following Merger') || 
       notification.title.includes('Unfollowed Merger'))
    ))
    .slice(0, maxItems);
  
  // Handle notification click to open merger details
  const handleNotificationClick = (mergerId: string) => {
    const merger = mergers.find(m => m.id === mergerId);
    if (merger) {
      setSelectedMerger(merger);
      setTimelineEvents(generateTimelineEvents(merger));
      setIsModalOpen(true);
    }
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
          <CardTitle>News</CardTitle>
          <CardDescription>Latest merger updates and activities</CardDescription>
        </div>
        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => window.markAllAsRead?.()}>
            Mark all as read
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[450px] w-full relative">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No news yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                News about mergers will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => {
                // Check if this notification is about a followed merger
                const isFollowedMerger = notification.mergerId && isMergerFollowed(notification.mergerId);
                
                return (
                  <div 
                    key={notification.id} 
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.isRead && "bg-muted/20",
                      isFollowedMerger && "bg-primary/5" // Subtle highlight for followed mergers
                    )}
                    onClick={() => notification.mergerId && handleNotificationClick(notification.mergerId)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-primary mt-0.5">
                        {notificationIcons[notification.type] || <Bell className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            {notification.mergerId ? (
                              <h4 className="font-bold">
                                {mergers.find(m => m.id === notification.mergerId)?.name || 'Unknown Merger'}
                                {isFollowedMerger && (
                                  <Badge variant="outline" className="ml-2 text-xs py-0 px-1.5">
                                    <Bell className="h-3 w-3 mr-1" />
                                    Following
                                  </Badge>
                                )}
                              </h4>
                            ) : (
                              <h4 className="font-bold">
                                {notification.title}
                              </h4>
                            )}
                            {notification.mergerId && notification.title.includes(':') && (
                              <p className="text-sm mt-1">
                                {notification.title.split(':')[1].trim()}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                            {format(notification.timestamp, "MMM d, h:mm a")}
                          </div>
                        </div>
                        
                        <p className="text-sm mt-1">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t pt-3">
        <Link href="/news" className="w-full">
          <Button variant="outline" className="w-full flex justify-between">
            <span>See More</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
      
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