"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/lib/contexts/NotificationsContext';
import { cn } from '@/lib/utils';

export const NotificationBell = () => {
  const { unreadCount, toggleNotificationPanel } = useNotifications();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={toggleNotificationPanel}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className={cn(
          "absolute top-1 right-1 h-4 min-w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center px-1",
          unreadCount > 99 ? "w-auto" : "w-4"
        )}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}; 