"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MoveRight, BarChart, Calculator } from "lucide-react";

export function NavBar() {
  const pathname = usePathname();
  
  return (
    <div className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <MoveRight className="h-5 w-5" />
          <span>Merger Reform</span>
        </div>
        
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/" ? "text-foreground" : "text-foreground/60"
            )}
          >
            <div className="flex items-center gap-1">
              <Calculator className="h-4 w-4" />
              <span>Calculator</span>
            </div>
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/dashboard" ? "text-foreground" : "text-foreground/60"
            )}
          >
            <div className="flex items-center gap-1">
              <BarChart className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
          </Link>
        </nav>
      </div>
    </div>
  );
} 