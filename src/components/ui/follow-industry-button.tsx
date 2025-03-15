"use client";

import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/lib/contexts/NotificationsContext';

interface FollowIndustryButtonProps {
  industry: string;
}

export function FollowIndustryButton({ industry }: FollowIndustryButtonProps) {
  const { followIndustry, unfollowIndustry, isIndustryFollowed, addNotification } = useNotifications();
  const isFollowed = isIndustryFollowed(industry);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowed) {
      unfollowIndustry(industry);
      
      addNotification({
        type: 'status_change',
        title: 'Unfollowed Industry',
        message: `You are no longer following the ${industry} industry.`,
      });
    } else {
      followIndustry(industry);
      
      addNotification({
        type: 'status_change',
        title: 'Following Industry',
        message: `You are now following the ${industry} industry. You'll receive updates about mergers in this industry.`,
      });
    }
  };

  return (
    <Button
      variant={isFollowed ? "secondary" : "outline"}
      className="flex items-center gap-2"
      size="sm"
      onClick={handleClick}
    >
      {isFollowed ? (
        <Bell className="h-4 w-4 text-primary" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {isFollowed ? "Following Industry" : "Follow Industry"}
    </Button>
  );
} 