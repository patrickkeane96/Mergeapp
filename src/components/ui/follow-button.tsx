"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/lib/contexts/NotificationsContext';
import { Bell, BellOff } from 'lucide-react';
import { Merger } from '@/types/merger';

interface FollowButtonProps {
  merger: Merger;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ 
  merger,
  className,
  variant = 'outline',
  size = 'sm',
  showText = true
}) => {
  const { 
    followMerger, 
    unfollowMerger, 
    isMergerFollowed, 
    addNotification 
  } = useNotifications();
  
  const isFollowed = isMergerFollowed(merger.id);
  
  const handleToggleFollow = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    
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
        message: `You're now following ${merger.name}. You'll receive updates when there are changes.`,
        mergerId: merger.id,
        industry: merger.industry,
      });
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        isFollowed && "bg-primary/10",
        className
      )}
      onClick={handleToggleFollow}
      title={isFollowed ? "Unfollow this merger" : "Follow this merger"}
    >
      {isFollowed ? (
        <>
          <BellOff className={cn("h-4 w-4", showText && "mr-2")} />
          {showText && "Unfollow"}
        </>
      ) : (
        <>
          <Bell className={cn("h-4 w-4", showText && "mr-2")} />
          {showText && "Follow"}
        </>
      )}
    </Button>
  );
}; 