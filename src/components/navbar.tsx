"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart, Calculator, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/notification-bell';
import { NotificationPanel } from '@/components/ui/notification-panel';
import { useNotifications } from '@/lib/contexts/NotificationsContext';
import { cn } from '@/lib/utils';

export const Navbar = () => {
  const pathname = usePathname();
  const { notifications } = useNotifications();
  
  const routes = [
    {
      label: 'Home',
      href: '/',
      icon: Home
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: BarChart
    },
    {
      label: 'Calculator',
      href: '/calculator',
      icon: Calculator
    }
  ];
  
  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Navigate to the appropriate page based on notification type
    if (notification.mergerId) {
      // For merger notifications, redirect to the dashboard with the merger selected
      window.location.href = `/dashboard?mergerId=${notification.mergerId}`;
    }
  };
  
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-6 md:gap-10">
            <Link 
              href="/" 
              className="flex items-center space-x-2 font-bold text-xl"
            >
              <span>Merger Reform Calculator</span>
            </Link>
            
            <nav className="hidden md:flex gap-6">
              {routes.map((route) => {
                const Icon = route.icon;
                const isActive = pathname === route.href;
                
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center text-sm font-medium transition-colors hover:text-primary",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {route.label}
                  </Link>
                );
              })}
            </nav>
            
            {/* Notification Bell - Disabled but still visible */}
            <div className="opacity-50 pointer-events-none">
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>
      
      {/* Global Notification Panel - Kept for future use but not active */}
      <NotificationPanel />
    </>
  );
}; 