"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Merger } from '@/types/merger';
import { differenceInBusinessDays } from 'date-fns';
// @ts-ignore - Fix for missing types in recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TrendDataPoint {
  name: string;
  month: string;
  avgDays: number;
  count: number;
}

interface ReviewTimeTrendProps {
  mergers: Merger[];
}

export function ReviewTimeTrend({ mergers }: ReviewTimeTrendProps) {
  // Calculate average review time by month
  const trendData: TrendDataPoint[] = React.useMemo(() => {
    const monthData: Record<string, { totalDays: number, count: number }> = {};
    
    // Only include completed mergers with end dates
    const completedMergers = mergers.filter(merger => 
      merger.outcome !== 'under_review' && merger.endDate
    );
    
    // Group by completion month
    completedMergers.forEach(merger => {
      if (!merger.endDate) return;
      
      // Calculate business days
      const days = differenceInBusinessDays(merger.endDate, merger.startDate);
      
      // Get month based on completion date
      const month = `${merger.endDate.getFullYear()}-${String(merger.endDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthData[month]) {
        monthData[month] = { totalDays: 0, count: 0 };
      }
      
      monthData[month].totalDays += days;
      monthData[month].count++;
    });
    
    // Ensure we have data starting from August 2024
    const startMonth = '2024-08';
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Create a list of all months from August 2024 to current month
    const allMonths = [];
    let year = 2024;
    let month = 8; // August
    
    while (`${year}-${String(month).padStart(2, '0')}` <= currentMonth) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      allMonths.push(monthKey);
      
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
    
    // Fill in data for all months
    allMonths.forEach(month => {
      if (!monthData[month]) {
        monthData[month] = { totalDays: 0, count: 0 };
      }
    });
    
    // Sort months chronologically
    const sortedMonths = Object.keys(monthData).sort();
    
    // Calculate monthly averages first
    const monthlyData = sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const name = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const data = monthData[month];
      const avgDays = data.count > 0 ? Math.round(data.totalDays / data.count) : 0;
      
      return {
        name,
        month,
        avgDays,
        count: data.count
      };
    });
    
    // Apply 6-month moving average
    return monthlyData.map((item, index) => {
      // For each point, calculate average of this month and previous 5 months (if available)
      const startIdx = Math.max(0, index - 5);
      const windowSlice = monthlyData.slice(startIdx, index + 1);
      
      const totalDays = windowSlice.reduce((sum, m) => sum + (m.avgDays * m.count), 0);
      const totalCount = windowSlice.reduce((sum, m) => sum + m.count, 0);
      
      // Calculate moving average
      const movingAvgDays = totalCount > 0 ? Math.round(totalDays / totalCount) : 0;
      
      return {
        ...item,
        avgDays: movingAvgDays
      };
    });
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
              <span className="text-muted-foreground"> completed reviews</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              6-month moving average
            </p>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const hasData = trendData.some(item => item.count > 0);

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <h3 className="text-base font-medium mb-4">Review Time Trend <span className="text-sm font-normal text-muted-foreground">(6-month moving average)</span></h3>
        
        {hasData ? (
          <div className="h-[168px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  tickMargin={10}
                />
                <YAxis 
                  width={30}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="avgDays"
                  stroke="#1B3B6F"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#1B3B6F" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[168px] text-muted-foreground">
            No completed reviews to analyze
          </div>
        )}
      </CardContent>
    </Card>
  );
} 