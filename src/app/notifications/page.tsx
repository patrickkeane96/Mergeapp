"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useNotifications } from '@/lib/contexts/NotificationsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Trash2, CheckCheck, AlertTriangle, Clock, Info, Check, X } from 'lucide-react';
import { NotificationType } from '@/lib/contexts/NotificationsContext';

// Create a simple tabs component since we're missing the imports
const TabsList = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`flex space-x-1 rounded-lg bg-muted p-1 ${className || ''}`}>
    {children}
  </div>
);

const TabsTrigger = ({ value, children, onClick, isActive }: { value: string, children: React.ReactNode, onClick: () => void, isActive: boolean }) => (
  <button
    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
      isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/80'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

// Define notification type to icon mapping
const notificationIcons: Record<string, React.ElementType> = {
  status_change: Info,
  filing_update: Clock,
  commitment_update: Info,
  nocc_issued: AlertTriangle,
  decision: Check,
  new_merger: Bell
};

// Color mapping for different outcomes
const outcomeColors: Record<string, string> = {
  under_review: 'bg-yellow-100 text-yellow-800',
  cleared: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
  cleared_with_commitments: 'bg-emerald-100 text-emerald-800',
};

interface NotificationTypeData {
  [key: string]: {
    title: string;
    message: string;
    outcome?: string;
  }
}

export default function NotificationsPage() {
  const { 
    notifications, 
    followedMergers, 
    followedIndustries,
    markAllAsRead,
    clearNotifications,
    unfollowMerger,
    unfollowIndustry,
    addNotification
  } = useNotifications();
  
  const [selectedTab, setSelectedTab] = useState('all');
  
  // Count of notifications per category
  const allCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const mergerUpdatesCount = notifications.filter(n => 
    n.type === 'status_change' || 
    n.type === 'commitment_update' || 
    n.type === 'decision'
  ).length;
  const filingsCount = notifications.filter(n => 
    n.type === 'filing_update' || 
    n.type === 'new_merger'
  ).length;
  const noccCount = notifications.filter(n => n.type === 'nocc_issued').length;
  
  // Create example notification
  const createExampleNotification = (type: string) => {
    const types: NotificationTypeData = {
      'status_change': {
        title: 'Example Status Change',
        message: 'A merger status has been updated from "Under Review" to "Cleared"',
        outcome: 'cleared'
      },
      'filing_update': {
        title: 'Example Filing Update',
        message: 'A new document has been filed for this merger case'
      },
      'commitment_update': {
        title: 'Example Commitment Update',
        message: 'New commitments have been proposed for this merger'
      },
      'nocc_issued': {
        title: 'Example NOCC Issued',
        message: 'A Notice of Competition Concerns (NOCC) has been issued for this merger'
      },
      'decision': {
        title: 'Example Decision',
        message: 'A final decision has been made on this merger case'
      },
      'new_merger': {
        title: 'Example New Merger',
        message: 'A new merger case has been filed in the Technology industry'
      }
    };
    
    addNotification({
      type: type as NotificationType,
      title: types[type].title,
      message: types[type].message,
      mergerId: 'merger-example',
      industry: 'Technology',
      outcome: (types[type].outcome || 'under_review') as any
    });
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your merger and industry notifications
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Followed Mergers</CardTitle>
              <CardDescription>
                You're following {followedMergers.length} merger cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {followedMergers.length > 0 ? (
                <div className="space-y-2">
                  {followedMergers.map(mergerId => (
                    <div key={mergerId} className="flex items-center justify-between py-2 border-b last:border-0">
                      <Link 
                        href={`/dashboard?mergerId=${mergerId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {mergerId.replace('merger-', 'Merger Case #')}
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unfollowMerger(mergerId)}
                        title="Unfollow this merger"
                      >
                        <BellOff className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>You're not following any mergers yet</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link href="/dashboard">
                      Browse Mergers
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Followed Industries</CardTitle>
              <CardDescription>
                You're following {followedIndustries.length} industries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {followedIndustries.length > 0 ? (
                <div className="space-y-2">
                  {followedIndustries.map(industry => (
                    <div key={industry} className="flex items-center justify-between py-2 border-b last:border-0">
                      <Link 
                        href={`/dashboard?industry=${encodeURIComponent(industry)}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {industry}
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unfollowIndustry(industry)}
                        title="Unfollow this industry"
                      >
                        <BellOff className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>You're not following any industries yet</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link href="/dashboard">
                      Browse Industries
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Test Notifications</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => createExampleNotification('status_change')}
                    >
                      Status Change
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => createExampleNotification('nocc_issued')}
                    >
                      NOCC Issued
                    </Button>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={markAllAsRead}
                      className="w-[48%]"
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Mark All Read
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearNotifications}
                      className="w-[48%]"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Notification History</CardTitle>
            <CardDescription>
              View and manage all your notifications
            </CardDescription>
            <div className="mt-4">
              <TabsList className="grid grid-cols-4 lg:w-[600px] w-full">
                <TabsTrigger 
                  value="all" 
                  isActive={selectedTab === 'all'} 
                  onClick={() => setSelectedTab('all')}
                >
                  All ({allCount})
                </TabsTrigger>
                <TabsTrigger 
                  value="unread" 
                  isActive={selectedTab === 'unread'} 
                  onClick={() => setSelectedTab('unread')}
                >
                  Unread ({unreadCount})
                </TabsTrigger>
                <TabsTrigger 
                  value="merger-updates" 
                  isActive={selectedTab === 'merger-updates'} 
                  onClick={() => setSelectedTab('merger-updates')}
                >
                  Updates ({mergerUpdatesCount})
                </TabsTrigger>
                <TabsTrigger 
                  value="nocc" 
                  isActive={selectedTab === 'nocc'} 
                  onClick={() => setSelectedTab('nocc')}
                >
                  NOCC ({noccCount})
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Notification</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications
                      .filter(notification => {
                        if (selectedTab === 'all') return true;
                        if (selectedTab === 'unread') return !notification.isRead;
                        if (selectedTab === 'merger-updates') {
                          return ['status_change', 'commitment_update', 'decision'].includes(notification.type);
                        }
                        if (selectedTab === 'nocc') return notification.type === 'nocc_issued';
                        return true;
                      })
                      .map(notification => {
                        const IconComponent = notificationIcons[notification.type] || Info;
                        
                        return (
                          <TableRow key={notification.id} className={!notification.isRead ? "bg-muted/30" : undefined}>
                            <TableCell>
                              <div className="flex justify-center">
                                <IconComponent className="h-5 w-5 text-primary" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{notification.title}</div>
                              <div className="text-sm text-muted-foreground">{notification.message}</div>
                            </TableCell>
                            <TableCell>
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
                                  <Badge className={`text-xs px-2 py-0.5 ${outcomeColors[notification.outcome]}`}>
                                    {notification.outcome.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                            </TableCell>
                            <TableCell>
                              {notification.mergerId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <Link
                                    href={`/dashboard?mergerId=${notification.mergerId}`}
                                    title="View this merger"
                                  >
                                    View
                                  </Link>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-1">No notifications</h3>
                <p className="text-muted-foreground">
                  Follow mergers or industries to receive notifications
                </p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 