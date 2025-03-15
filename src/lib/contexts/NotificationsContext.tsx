"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Merger, MergerOutcome } from '@/types/merger';
import { generatePlaceholderData } from '@/lib/utils/placeholder-data';

// Define notification types
export type NotificationType = 
  | 'status_change' 
  | 'filing_update' 
  | 'commitment_update' 
  | 'nocc_issued' 
  | 'decision'
  | 'new_merger';

// Define notification data structure
export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  mergerId?: string;
  industry?: string;
  outcome?: MergerOutcome;
  isRead: boolean;
};

// Context type definition
export type NotificationsContextType = {
  notifications: Notification[];
  mergers: Merger[];
  unreadCount: number;
  followedMergers: string[];
  followedIndustries: string[];
  isNotificationPanelOpen: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  followMerger: (mergerId: string) => void;
  unfollowMerger: (mergerId: string) => void;
  isMergerFollowed: (mergerId: string) => boolean;
  followIndustry: (industry: string) => void;
  unfollowIndustry: (industry: string) => void;
  isIndustryFollowed: (industry: string) => boolean;
  toggleNotificationPanel: () => void;
  closeNotificationPanel: () => void;
  showOnlyFollowed: boolean;
  toggleShowOnlyFollowed: () => void;
};

// Create context with default values
const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  mergers: [],
  unreadCount: 0,
  followedMergers: [],
  followedIndustries: [],
  isNotificationPanelOpen: false,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
  followMerger: () => {},
  unfollowMerger: () => {},
  isMergerFollowed: () => false,
  followIndustry: () => {},
  unfollowIndustry: () => {},
  isIndustryFollowed: () => false,
  toggleNotificationPanel: () => {},
  closeNotificationPanel: () => {},
  showOnlyFollowed: false,
  toggleShowOnlyFollowed: () => {},
});

// Generate a random notification ID
const generateNotificationId = () => `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Provider component
export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followedMergers, setFollowedMergers] = useState<string[]>([]);
  const [followedIndustries, setFollowedIndustries] = useState<string[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [showOnlyFollowed, setShowOnlyFollowed] = useState(false);
  
  // Generate placeholder mergers data (in a real app, this would come from an API)
  const mergers = generatePlaceholderData();
  
  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
  // Load saved data from localStorage on mount (only in browser)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotifications = localStorage.getItem('notifications');
      const savedFollowedMergers = localStorage.getItem('followedMergers');
      const savedFollowedIndustries = localStorage.getItem('followedIndustries');
      
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications);
          // Convert string timestamps back to Date objects
          const notificationsWithDates = parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
          setNotifications(notificationsWithDates);
        } catch (e) {
          console.error('Failed to parse saved notifications', e);
        }
      }
      
      if (savedFollowedMergers) {
        try {
          setFollowedMergers(JSON.parse(savedFollowedMergers));
        } catch (e) {
          console.error('Failed to parse saved followed mergers', e);
        }
      }
      
      if (savedFollowedIndustries) {
        try {
          setFollowedIndustries(JSON.parse(savedFollowedIndustries));
        } catch (e) {
          console.error('Failed to parse saved followed industries', e);
        }
      }
    }
  }, []);
  
  // Save to localStorage whenever data changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(notifications));
      localStorage.setItem('followedMergers', JSON.stringify(followedMergers));
      localStorage.setItem('followedIndustries', JSON.stringify(followedIndustries));
    }
  }, [notifications, followedMergers, followedIndustries]);
  
  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateNotificationId(),
      isRead: false,
      timestamp: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };
  
  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };
  
  // Follow a merger
  const followMerger = (mergerId: string) => {
    if (!followedMergers.includes(mergerId)) {
      setFollowedMergers(prev => [...prev, mergerId]);
    }
  };
  
  // Unfollow a merger
  const unfollowMerger = (mergerId: string) => {
    setFollowedMergers(prev => prev.filter(id => id !== mergerId));
  };
  
  // Check if a merger is followed
  const isMergerFollowed = (mergerId: string) => {
    return followedMergers.includes(mergerId);
  };
  
  // Follow an industry
  const followIndustry = (industry: string) => {
    if (!followedIndustries.includes(industry)) {
      setFollowedIndustries(prev => [...prev, industry]);
    }
  };
  
  // Unfollow an industry
  const unfollowIndustry = (industry: string) => {
    setFollowedIndustries(prev => prev.filter(ind => ind !== industry));
  };
  
  // Check if an industry is followed
  const isIndustryFollowed = (industry: string) => {
    return followedIndustries.includes(industry);
  };
  
  // Toggle notification panel
  const toggleNotificationPanel = () => {
    setIsNotificationPanelOpen(prev => !prev);
  };
  
  // Close notification panel
  const closeNotificationPanel = () => {
    setIsNotificationPanelOpen(false);
  };
  
  // Toggle show only followed
  const toggleShowOnlyFollowed = () => {
    setShowOnlyFollowed(prev => !prev);
  };
  
  // Context value
  const value = {
    notifications,
    mergers,
    unreadCount,
    followedMergers,
    followedIndustries,
    isNotificationPanelOpen,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    followMerger,
    unfollowMerger,
    isMergerFollowed,
    followIndustry,
    unfollowIndustry,
    isIndustryFollowed,
    toggleNotificationPanel,
    closeNotificationPanel,
    showOnlyFollowed,
    toggleShowOnlyFollowed,
  };
  
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

// Custom hook for using notifications context
export const useNotifications = () => useContext(NotificationsContext); 