"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Nav() {
  const pathname = usePathname();
  
  const tabs = [
    {
      title: "Dashboard",
      href: "/dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      title: "Statistics",
      href: "/statistics",
      isActive: pathname === "/statistics",
    },
    {
      title: "Notifications",
      href: "/notifications",
      isActive: pathname === "/notifications",
    },
    {
      title: "Settings",
      href: "/settings",
      isActive: pathname === "/settings",
    },
  ];

  return (
    <div className="flex space-x-4 border-b">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
            tab.isActive
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          )}
        >
          {tab.title}
        </Link>
      ))}
    </div>
  );
} 