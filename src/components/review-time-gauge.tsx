"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - Fix for missing types in recharts
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from '@/lib/utils';

interface ReviewTimeGaugeProps {
  averageDays: number;
  maxDays: number;
  title?: string;
  description?: string;
}

export function ReviewTimeGauge({ 
  averageDays, 
  maxDays, 
  title = "Average Review Time", 
  description = "Business days from filing to decision" 
}: ReviewTimeGaugeProps) {
  // Calculate the percentage for the gauge
  const percentage = Math.min(100, (averageDays / maxDays) * 100);
  
  // Determine color based on review time
  // Green if less than 33% of max, yellow if between 33-66%, red if above 66%
  const getGaugeColor = () => {
    if (percentage < 33) return '#10B981'; // Green
    if (percentage < 66) return '#FBBF24'; // Yellow
    return '#EF4444'; // Red
  };
  
  // Data for the pie chart gauge
  const data = [
    { name: 'filled', value: percentage },
    { name: 'unfilled', value: 100 - percentage }
  ];
  
  // Colors for the gauge parts
  const COLORS = [getGaugeColor(), '#F3F4F6'];
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-md">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 pb-0">
        <div className="h-44 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="60%"
                startAngle={180}
                endAngle={0}
                outerRadius={80}
                innerRadius={60}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{averageDays}</span>
            <span className="text-sm text-muted-foreground">business days</span>
          </div>
        </div>
        
        <div className="mt-2 grid grid-cols-3 text-center text-sm mb-4">
          <div className="text-green-600 font-medium">Fast (&lt;{Math.round(maxDays * 0.33)})</div>
          <div className="text-yellow-500 font-medium">Medium</div>
          <div className="text-red-600 font-medium">Slow (&gt;{Math.round(maxDays * 0.66)})</div>
        </div>
      </CardContent>
    </Card>
  );
} 