"use client";

import React, { useState, useMemo } from "react";
import { format } from 'date-fns';
import { ArrowLeft, Bell, Clock, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Notification } from '@/lib/contexts/NotificationsContext';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/lib/contexts/NotificationsContext';
import { Merger } from '@/types/merger';
import { MergerDetailsModal } from '@/components/merger-details-modal';
import Link from 'next/link';
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

export default function NewsPage() {
  const { notifications, markAllAsRead, mergers, isMergerFollowed } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // State for selected merger and modal
  const [selectedMerger, setSelectedMerger] = useState<Merger | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  
  // Add state for followed filter
  const [showOnlyFollowed, setShowOnlyFollowed] = useState(false);
  
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
  
  // Get all notification types for filtering
  const notificationTypes = useMemo(() => {
    // Filter out 'status_change' notifications that are about following/unfollowing
    const filteredTypes = Array.from(new Set(
      notifications
        .filter(n => !(n.type === 'status_change' && 
                      (n.title.includes('Following Merger') || 
                       n.title.includes('Unfollowed Merger'))))
        .map(n => n.type)
    ));
    return filteredTypes;
  }, [notifications]);
  
  // Filter notifications based on search and type
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(notification => {
        // Skip notifications about following/unfollowing mergers
        if (notification.type === 'status_change' && 
            (notification.title.includes('Following Merger') || 
             notification.title.includes('Unfollowed Merger'))) {
          return false;
        }
        
        // Apply followed filter
        if (showOnlyFollowed && notification.mergerId && !isMergerFollowed(notification.mergerId)) {
          return false;
        }
        
        const matchesSearch = searchQuery === '' || 
          notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesType = selectedType === null || notification.type === selectedType;
        
        return matchesSearch && matchesType;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [notifications, searchQuery, selectedType, showOnlyFollowed, isMergerFollowed]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">News & Updates</h1>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Updates</CardTitle>
              <CardDescription>View all merger related updates and notifications</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={markAllAsRead}>
                Mark All as Read
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-64">
              <Select
                value={selectedType || "all"}
                onValueChange={(value) => setSelectedType(value === "all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {notificationTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant={showOnlyFollowed ? "default" : "outline"}
              onClick={() => setShowOnlyFollowed(!showOnlyFollowed)}
              className="whitespace-nowrap"
            >
              <Bell className="h-4 w-4 mr-2" />
              {showOnlyFollowed ? "All Mergers" : "Followed Only"}
            </Button>
          </div>
          
          {/* Notifications list */}
          <ScrollArea className="h-[calc(100vh-18rem)]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No notifications found</p>
                {searchQuery || selectedType ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search filters
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    News will appear here as mergers are updated
                  </p>
                )}
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
      </Card>
      
      {/* Merger Details Modal */}
      <MergerDetailsModal
        merger={selectedMerger}
        timelineEvents={timelineEvents}
        isOpen={isModalOpen || isModalClosing}
        onClose={handleModalClose}
      />
    </div>
  );
} 