"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - Fix for missing types in recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartDataItem } from '@/types/merger';

// Outcome configuration (for consistent colors and labels)
const outcomeConfig = {
  under_review: {
    label: "Under Review",
    color: "#FBBF24", // Yellow
    barColor: "#FBBF24",
  },
  cleared: {
    label: "Cleared",
    color: "#10B981", // Green
    barColor: "#10B981",
  },
  blocked: {
    label: "Blocked",
    color: "#EF4444", // Red
    barColor: "#EF4444",
  },
  cleared_with_commitments: {
    label: "Cleared with Commitments",
    color: "#059669", // Different shade of green
    barColor: "#059669",
  }
};

interface MergerChartProps {
  chartData: ChartDataItem[];
  onBarClick: (data: any) => void;
  selectedMonth: string | null;
}

export function MergerChart({ chartData, onBarClick, selectedMonth }: MergerChartProps) {
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 mt-1">
            {payload.map((entry: any) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">{entry.name}: {entry.value}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 border-t mt-1">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-sm font-medium">
                Total: {payload.reduce((sum: number, entry: any) => sum + entry.value, 0)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merger Reviews by Month</CardTitle>
        <CardDescription>
          Click on bars to filter the table by month
          {selectedMonth && " (Filtered by month)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              barGap={0}
              barCategoryGap="20%"
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
              <Legend />
              <Bar
                dataKey="under_review"
                stackId="a"
                name="Under Review"
                fill={outcomeConfig.under_review.barColor}
                onClick={onBarClick}
                cursor="pointer"
              />
              <Bar
                dataKey="cleared"
                stackId="a"
                name="Cleared"
                fill={outcomeConfig.cleared.barColor}
                onClick={onBarClick}
                cursor="pointer"
              />
              <Bar
                dataKey="blocked"
                stackId="a"
                name="Blocked"
                fill={outcomeConfig.blocked.barColor}
                onClick={onBarClick}
                cursor="pointer"
              />
              <Bar
                dataKey="cleared_with_commitments"
                stackId="a"
                name="Cleared with Commitments"
                fill={outcomeConfig.cleared_with_commitments.barColor}
                onClick={onBarClick}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 