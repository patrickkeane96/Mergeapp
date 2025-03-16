"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - Fix for missing types in recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Merger } from '@/types/merger';
import { differenceInBusinessDays } from 'date-fns';
import { Clock } from 'lucide-react';
import { PhaseProportionBar } from '@/components/phase-proportion-bar';
import { ReviewTimeByIndustry } from '@/components/review-time-by-industry';

interface TrendDataPoint {
  name: string;
  month: string;
  avgDays: number;
  count: number;
}

interface CombinedReviewTimeProps {
  mergers: Merger[];
  allMergers: Merger[];
}

export function CombinedReviewTime({ mergers, allMergers }: CombinedReviewTimeProps) {
  // Calculate average review time for completed mergers
  const reviewTimeData = React.useMemo(() => {
    const completedMergers = mergers.filter(merger => 
      merger.outcome !== 'under_review' && merger.endDate
    );
    
    if (completedMergers.length === 0) return { average: 0, max: 120, count: 0 };
    
    const totalDays = completedMergers.reduce((sum, merger) => {
      if (!merger.endDate) return sum;
      return sum + differenceInBusinessDays(merger.endDate, merger.startDate);
    }, 0);
    
    return {
      average: Math.round(totalDays / completedMergers.length),
      count: completedMergers.length
    };
  }, [mergers]);

  // Generate trend data for completed mergers
  const trendData: TrendDataPoint[] = React.useMemo(() => {
    const monthData: Record<string, { totalDays: number, count: number }> = {};
    
    // Only include completed mergers with end dates
    const completedMergers = mergers.filter(merger => 
      merger.outcome !== 'under_review' && merger.endDate
    );
    
    // Group by end date month
    completedMergers.forEach(merger => {
      if (!merger.endDate) return;
      
      // Calculate business days
      const days = differenceInBusinessDays(merger.endDate, merger.startDate);
      
      // Get month as key
      const month = `${merger.endDate.getFullYear()}-${String(merger.endDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthData[month]) {
        monthData[month] = { totalDays: 0, count: 0 };
      }
      
      monthData[month].totalDays += days;
      monthData[month].count++;
    });
    
    // Calculate average and sort chronologically
    return Object.entries(monthData)
      .map(([month, data]) => {
        const [year, monthNum] = month.split('-');
        return {
          name: new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          month,
          avgDays: Math.round(data.totalDays / data.count),
          count: data.count
        };
      })
      .sort((a, b) => {
        const [aYear, aMonth] = a.month.split('-').map(Number);
        const [bYear, bMonth] = b.month.split('-').map(Number);
        return (aYear - bYear) || (aMonth - bMonth);
      });
  }, [mergers]);
  
  // Calculate phase proportion data
  const phaseData = React.useMemo(() => {
    const completedMergers = mergers.filter(merger => 
      merger.outcome !== 'under_review' && merger.endDate
    );
    
    if (completedMergers.length === 0) return { 
      phase1: 0, 
      phase2: 0, 
      total: 0,
      phase1Percentage: 0,
      phase2Percentage: 0
    };
    
    const phase2Count = completedMergers.filter(merger => merger.hasPhase2).length;
    const phase1Count = completedMergers.length - phase2Count;
    
    return {
      phase1: phase1Count,
      phase2: phase2Count,
      total: completedMergers.length,
      phase1Percentage: Math.round((phase1Count / completedMergers.length) * 100),
      phase2Percentage: Math.round((phase2Count / completedMergers.length) * 100)
    };
  }, [mergers]);
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium">{data.name}</p>
          <div className="space-y-1 mt-1">
            <p className="text-sm">
              <span className="font-medium">{data.avgDays}</span> days average
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Based on </span> 
              <span className="font-medium">{data.count}</span> 
              <span className="text-muted-foreground"> reviews</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Review Time Analysis
        </CardTitle>
        <CardDescription>
          Average business days and monthly trends
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 md:w-1/3 border rounded-lg p-4 flex flex-col items-center justify-center bg-primary/5">
              <div className="text-sm text-muted-foreground mb-2">Average Review Time</div>
              <div className="text-5xl font-bold text-primary">
                {reviewTimeData.average}
              </div>
              <div className="text-sm text-muted-foreground mt-2">business days</div>
              <div className="text-xs text-muted-foreground mt-4">
                Based on {reviewTimeData.count} completed reviews
              </div>
            </div>
            
            <div className="flex-1 md:w-2/3 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="avgDays" 
                    stroke="#1B3B6F" 
                    strokeWidth={2} 
                    dot={{ fill: '#1B3B6F', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Phase Proportion Bar */}
            <div className="flex-1">
              <PhaseProportionBar phaseData={phaseData} />
            </div>
            
            {/* Review Time by Industry */}
            <div className="flex-1">
              <ReviewTimeByIndustry allMergers={allMergers} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 