"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Home, PieChart } from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserSelector } from '@/components/user-selector';
import { cn } from '@/lib/utils';

// Define routes for the navbar
const routes = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: PieChart,
  },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="px-6 flex h-16 items-center max-w-[1536px] mx-auto">
        <div className="flex items-center gap-6 md:gap-10">
          <Link
            href="/"
            className="flex items-center space-x-2 font-bold text-xl"
          >
            <BarChart2 className="h-6 w-6" />
            <span>Merger Dashboard</span>
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
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserSelector />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
} 