"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Merger, MergerOutcome } from '@/types/merger';
import { supabase } from '@/lib/supabase/supabase';
import { useUser } from './UserContext';
import { fetchMergers } from '@/lib/supabase/mergerUtils';

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
  refreshMergers: () => Promise<void>;
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
  refreshMergers: async () => {},
});

// Generate a random notification ID
const generateNotificationId = () => `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Provider component
export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get current user from UserContext
  const { currentUser } = useUser();
  
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mergers, setMergers] = useState<Merger[]>([]);
  const [followedMergers, setFollowedMergers] = useState<string[]>([]);
  const [followedIndustries, setFollowedIndustries] = useState<string[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [showOnlyFollowed, setShowOnlyFollowed] = useState(false);
  
  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
  // Fetch mergers from Supabase
  const refreshMergers = async () => {
    try {
      const fetchedMergers = await fetchMergers();
      setMergers(fetchedMergers);
    } catch (error) {
      console.error('Error fetching mergers:', error);
    }
  };
  
  // Load mergers on mount
  useEffect(() => {
    refreshMergers();
  }, []);
  
  // Load followed mergers when user changes
  useEffect(() => {
    if (currentUser) {
      fetchFollowedMergers();
      fetchNotifications();
    } else {
      // Clear followed mergers and notifications when no user is selected
      setFollowedMergers([]);
      setNotifications([]);
    }
  }, [currentUser]);
  
  // Fetch followed mergers for the current user
  const fetchFollowedMergers = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('user_mergers')
        .select('merger_id')
        .eq('user_id', currentUser.id)
        .eq('is_following', true);
      
      if (error) {
        console.error('Error fetching followed mergers:', error);
        return;
      }
      
      if (data) {
        const mergerIds = data.map(item => item.merger_id);
        setFollowedMergers(mergerIds);
      }
    } catch (error) {
      console.error('Error in fetchFollowedMergers:', error);
    }
  };
  
  // Fetch notifications for the current user
  const fetchNotifications = async () => {
    if (!currentUser) return;
    
    try {
      // Get all notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (notificationsError) {
        console.error('Error fetching notifications:', notificationsError);
        return;
      }
      
      if (!notificationsData) return;
      
      // Get read status for the current user
      const { data: readStatusData, error: readStatusError } = await supabase
        .from('user_notifications')
        .select('notification_id, is_read')
        .eq('user_id', currentUser.id);
      
      if (readStatusError) {
        console.error('Error fetching read status:', readStatusError);
        return;
      }
      
      // Create a map of notification IDs to read status
      const readStatusMap = new Map();
      if (readStatusData) {
        readStatusData.forEach(item => {
          readStatusMap.set(item.notification_id, item.is_read);
        });
      }
      
      // Map notifications with read status
      const mappedNotifications: Notification[] = notificationsData.map(notification => ({
        id: notification.id,
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.message,
        timestamp: new Date(notification.created_at),
        mergerId: notification.merger_id,
        isRead: readStatusMap.has(notification.id) ? readStatusMap.get(notification.id) : false
      }));
      
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  };
  
  // Add a new notification
  const addNotification = async (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => {
    try {
      // Insert notification into Supabase
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          merger_id: notification.mergerId
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding notification:', error);
        return;
      }
      
      if (!data) return;
      
      // Create new notification object
      const newNotification: Notification = {
        ...notification,
        id: data.id,
        isRead: false,
        timestamp: new Date(data.created_at),
      };
      
      // Update state
      setNotifications(prev => [newNotification, ...prev]);
      
      // Refresh mergers to get latest data
      refreshMergers();
    } catch (error) {
      console.error('Error in addNotification:', error);
    }
  };
  
  // Mark a notification as read
  const markAsRead = async (id: string) => {
    if (!currentUser) return;
    
    try {
      // Check if user_notification record exists
      const { data: existingData, error: existingError } = await supabase
        .from('user_notifications')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('notification_id', id)
        .single();
      
      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking existing user_notification:', existingError);
        return;
      }
      
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_notifications')
          .update({ is_read: true })
          .eq('id', existingData.id);
        
        if (updateError) {
          console.error('Error updating user_notification:', updateError);
          return;
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('user_notifications')
          .insert({
            user_id: currentUser.id,
            notification_id: id,
            is_read: true
          });
        
        if (insertError) {
          console.error('Error inserting user_notification:', insertError);
          return;
        }
      }
      
      // Update state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser) return;
    
    try {
      // Get all notification IDs
      const notificationIds = notifications.map(n => n.id);
      
      // Create a batch of user_notification records
      const batchRecords = notificationIds.map(notificationId => ({
        user_id: currentUser.id,
        notification_id: notificationId,
        is_read: true
      }));
      
      // Use upsert to handle both insert and update in one operation
      if (batchRecords.length > 0) {
        const { error } = await supabase
          .from('user_notifications')
          .upsert(batchRecords, { 
            onConflict: 'user_id,notification_id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error('Error batch updating user_notifications:', error);
          
          // Fall back to individual updates if batch fails
          for (const notificationId of notificationIds) {
            // Check if user_notification record exists
            const { data: existingData, error: existingError } = await supabase
              .from('user_notifications')
              .select('id')
              .eq('user_id', currentUser.id)
              .eq('notification_id', notificationId)
              .single();
            
            if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
              console.error('Error checking existing user_notification:', existingError);
              continue;
            }
            
            if (existingData) {
              // Update existing record
              const { error: updateError } = await supabase
                .from('user_notifications')
                .update({ is_read: true })
                .eq('id', existingData.id);
              
              if (updateError) {
                console.error('Error updating user_notification:', updateError);
              }
            } else {
              // Insert new record
              const { error: insertError } = await supabase
                .from('user_notifications')
                .insert({
                  user_id: currentUser.id,
                  notification_id: notificationId,
                  is_read: true
                });
              
              if (insertError) {
                console.error('Error inserting user_notification:', insertError);
              }
            }
          }
        }
      }
      
      // Immediately update state to mark all as read
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Don't automatically re-fetch notifications - this was causing read notifications to reappear
      // The UI state should reflect the user's action without needing to re-verify with the database
      
      return true; // Return success for components to use
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false; // Return failure for components to use
    }
  };
  
  // Clear all notifications (not implemented for database)
  const clearNotifications = () => {
    // This would require deleting notifications from the database,
    // which might not be desired. Instead, we just mark them as read.
    markAllAsRead();
  };
  
  // Follow a merger
  const followMerger = async (mergerId: string) => {
    if (!currentUser) return;
    
    try {
      // Check if user_merger record exists
      const { data: existingData, error: existingError } = await supabase
        .from('user_mergers')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('merger_id', mergerId)
        .single();
      
      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking existing user_merger:', existingError);
        return;
      }
      
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_mergers')
          .update({ is_following: true })
          .eq('id', existingData.id);
        
        if (updateError) {
          console.error('Error updating user_merger:', updateError);
          return;
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('user_mergers')
          .insert({
            user_id: currentUser.id,
            merger_id: mergerId,
            is_following: true
          });
        
        if (insertError) {
          console.error('Error inserting user_merger:', insertError);
          return;
        }
      }
      
      // Update state
      if (!followedMergers.includes(mergerId)) {
        setFollowedMergers(prev => [...prev, mergerId]);
      }
    } catch (error) {
      console.error('Error in followMerger:', error);
    }
  };
  
  // Unfollow a merger
  const unfollowMerger = async (mergerId: string) => {
    if (!currentUser) return;
    
    try {
      // Update user_merger record
      const { error } = await supabase
        .from('user_mergers')
        .upsert({
          user_id: currentUser.id,
          merger_id: mergerId,
          is_following: false
        }, {
          onConflict: 'user_id,merger_id'
        });
      
      if (error) {
        console.error('Error unfollowing merger:', error);
        return;
      }
      
      // Update state
      setFollowedMergers(prev => prev.filter(id => id !== mergerId));
    } catch (error) {
      console.error('Error in unfollowMerger:', error);
    }
  };
  
  // Check if a merger is followed
  const isMergerFollowed = (mergerId: string) => {
    return followedMergers.includes(mergerId);
  };
  
  // Follow an industry (stored in localStorage for simplicity)
  const followIndustry = (industry: string) => {
    if (!followedIndustries.includes(industry)) {
      const newFollowedIndustries = [...followedIndustries, industry];
      setFollowedIndustries(newFollowedIndustries);
      if (typeof window !== 'undefined') {
        localStorage.setItem('followedIndustries', JSON.stringify(newFollowedIndustries));
      }
    }
  };
  
  // Unfollow an industry (stored in localStorage for simplicity)
  const unfollowIndustry = (industry: string) => {
    const newFollowedIndustries = followedIndustries.filter(ind => ind !== industry);
    setFollowedIndustries(newFollowedIndustries);
    if (typeof window !== 'undefined') {
      localStorage.setItem('followedIndustries', JSON.stringify(newFollowedIndustries));
    }
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
  
  // Load followed industries from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFollowedIndustries = localStorage.getItem('followedIndustries');
      
      if (savedFollowedIndustries) {
        try {
          setFollowedIndustries(JSON.parse(savedFollowedIndustries));
        } catch (e) {
          console.error('Failed to parse saved followed industries', e);
        }
      }
    }
  }, []);
  
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
    refreshMergers,
  };
  
  useEffect(() => {
    // Initial fetch
    fetchFollowedMergers();
    fetchNotifications();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchFollowedMergers();
      fetchNotifications();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [fetchFollowedMergers, fetchNotifications]);
  
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

// Custom hook for using the notifications context
export const useNotifications = () => useContext(NotificationsContext); 