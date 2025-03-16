"use client";

import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/lib/contexts/NotificationsContext';

export function NotificationBell() {
  const { unreadCount, toggleNotificationPanel } = useNotifications();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleNotificationPanel}
      className="relative"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
} 