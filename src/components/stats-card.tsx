"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend,
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-primary/5 pb-2 min-h-[70px]">
        <CardTitle className="text-md flex items-center justify-between">
          <span className="flex items-center gap-2">
            {icon && <div className="text-primary">{icon}</div>}
            {title}
          </span>
        </CardTitle>
        {description && (
          <CardDescription>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-4xl font-bold">
          {value}
        </div>
        
        {trend && (
          <div className={cn(
            "text-sm mt-2 flex items-center",
            trend.positive ? "text-green-600" : "text-red-600"
          )}>
            <span className="mr-1">
              {trend.positive ? '↑' : '↓'}
            </span>
            {trend.value}% {trend.positive ? 'increase' : 'decrease'} from previous period
          </div>
        )}
      </CardContent>
    </Card>
  );
} 