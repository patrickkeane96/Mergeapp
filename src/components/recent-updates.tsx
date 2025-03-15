"use client";

import React from 'react';
import { format } from 'date-fns';
import { Bell, Clock, AlertCircle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Notification } from '@/lib/contexts/NotificationsContext';
import { cn } from '@/lib/utils';

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

interface RecentUpdatesProps {
  notifications: Notification[];
  onSelectMerger: (mergerId: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function RecentUpdates({ 
  notifications, 
  onSelectMerger, 
  onMarkAsRead,
  onMarkAllAsRead
}: RecentUpdatesProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Updates</CardTitle>
          <CardDescription>Latest merger review updates and notifications</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
          Mark All as Read
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[calc(100vh-13rem)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Follow mergers or industries to receive updates
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors",
                    !notification.isRead && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-primary mt-0.5">
                      {notificationIcons[notification.type] || <Bell className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{notification.title}</h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                          onClick={() => onMarkAsRead(notification.id)}
                        >
                          {notification.isRead ? "Read" : "Mark as read"}
                        </Button>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(notification.timestamp, "MMM d, h:mm a")}
                        </div>
                        
                        {notification.outcome && (
                          <Badge
                            className={cn(
                              "text-xs px-1.5 py-0.5",
                              outcomeConfig[notification.outcome].bgColor,
                              outcomeConfig[notification.outcome].textColor
                            )}
                          >
                            {outcomeConfig[notification.outcome].label}
                          </Badge>
                        )}
                      </div>
                      
                      {notification.mergerId && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-6 px-0 mt-1"
                          onClick={() => onSelectMerger(notification.mergerId!)}
                        >
                          View Merger Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 