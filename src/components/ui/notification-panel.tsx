"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Bell, Check, CheckCheck, X, Clock, AlertTriangle, Info } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Notification, useNotifications } from '@/lib/contexts/NotificationsContext';
import { cn } from '@/lib/utils';
import { MergerOutcome, Merger } from '@/types/merger';
import { MergerDetailsModal } from '@/components/merger-details-modal';
import { generateTimelineEvents } from '@/lib/utils/merger-utils';

// Configuration for notification colors and icons based on type
const notificationConfig = {
  status_change: {
    icon: Info,
    color: 'text-blue-500',
  },
  filing_update: {
    icon: Clock,
    color: 'text-purple-500',
  },
  commitment_update: {
    icon: Info,
    color: 'text-emerald-500',
  },
  nocc_issued: {
    icon: AlertTriangle,
    color: 'text-amber-500',
  },
  decision: {
    icon: Check,
    color: 'text-green-500',
  },
  new_merger: {
    icon: Bell,
    color: 'text-indigo-500',
  }
};

// Color mapping for different outcomes
const outcomeColors: Record<MergerOutcome, string> = {
  under_review: 'bg-yellow-100 text-yellow-800',
  cleared: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
  cleared_with_commitments: 'bg-emerald-100 text-emerald-800',
};

// Component to display a single notification
const NotificationItem = ({ 
  notification, 
  onClick 
}: { 
  notification: Notification; 
  onClick: (notification: Notification) => void;
}) => {
  const { markAsRead, mergers, isMergerFollowed } = useNotifications();
  const { icon: Icon, color } = notificationConfig[notification.type] || {
    icon: Info,
    color: 'text-blue-500',
  };
  
  const handleClick = () => {
    markAsRead(notification.id);
    onClick(notification);
  };
  
  const isFollowedMerger = notification.mergerId && isMergerFollowed?.(notification.mergerId);
  
  return (
    <div 
      className={cn(
        "p-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors",
        !notification.isRead && "bg-muted/30",
        isFollowedMerger && "bg-primary/5" // Subtle highlight for followed mergers
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-1", color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <div>
              {notification.mergerId ? (
                <h4 className="text-sm font-bold">
                  {mergers.find(m => m.id === notification.mergerId)?.name || 'Unknown Merger'}
                  {isFollowedMerger && (
                    <Badge variant="outline" className="ml-2 text-xs py-0 px-1.5">
                      <Bell className="h-3 w-3 mr-1" />
                      Following
                    </Badge>
                  )}
                </h4>
              ) : (
                <h4 className="text-sm font-bold">
                  {notification.title}
                </h4>
              )}
              {notification.mergerId && notification.title.includes(':') && (
                <p className="text-xs text-muted-foreground mt-1">
                  {notification.title.split(':')[1].trim()}
                </p>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
              {format(notification.timestamp, 'MMM d, h:mm a')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
          <div className="flex flex-wrap gap-2">
            {notification.mergerId && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                Merger ID: {notification.mergerId.replace('merger-', '#')}
              </Badge>
            )}
            {notification.industry && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {notification.industry}
              </Badge>
            )}
            {notification.outcome && (
              <Badge className={cn("text-xs px-2 py-0.5", outcomeColors[notification.outcome])}>
                {notification.outcome.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            )}
          </div>
        </div>
        {!notification.isRead && (
          <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
        )}
      </div>
    </div>
  );
};

// Empty state component when there are no notifications
const EmptyNotifications = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
    <h3 className="text-lg font-medium">No notifications</h3>
    <p className="text-sm text-muted-foreground mt-1 max-w-md">
      Follow mergers or industries to receive notifications about updates and status changes.
    </p>
  </div>
);

// Main notification panel component
export const NotificationPanel = () => {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    clearNotifications,
    isNotificationPanelOpen,
    closeNotificationPanel,
    mergers
  } = useNotifications();
  
  const [selectedMerger, setSelectedMerger] = useState<Merger | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);
  
  // Handle notification click to open merger details
  const handleNotificationClick = (notification: Notification) => {
    if (notification.mergerId) {
      const merger = mergers.find(m => m.id === notification.mergerId);
      if (merger) {
        setSelectedMerger(merger);
        setTimelineEvents(generateTimelineEvents(merger));
        setIsModalOpen(true);
      }
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
    <Sheet open={isNotificationPanelOpen} onOpenChange={closeNotificationPanel}>
      <SheetContent side="right" className="sm:max-w-md w-full p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2">{unreadCount}</Badge>
              )}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="h-8 px-2"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    <span className="sr-only sm:not-sr-only sm:inline">Mark all read</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearNotifications}
                    title="Clear all notifications"
                    className="h-8 px-2"
                  >
                    <X className="h-4 w-4 mr-1" />
                    <span className="sr-only sm:not-sr-only sm:inline">Clear all</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetHeader>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start px-6 pt-2">
            <TabsTrigger value="all" className="flex-1">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread ({unreadNotifications.length})
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <TabsContent value="all" className="m-0 p-0">
              {notifications.length > 0 ? (
                <div>
                  {notifications.map(notification => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              ) : (
                <EmptyNotifications />
              )}
            </TabsContent>
            
            <TabsContent value="unread" className="m-0 p-0">
              {unreadNotifications.length > 0 ? (
                <div>
                  {unreadNotifications.map(notification => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <CheckCheck className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You have no unread notifications.
                  </p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        {/* Merger Details Modal */}
        <MergerDetailsModal
          merger={selectedMerger}
          timelineEvents={timelineEvents}
          isOpen={isModalOpen || isModalClosing}
          onClose={handleModalClose}
        />
      </SheetContent>
    </Sheet>
  );
}; 