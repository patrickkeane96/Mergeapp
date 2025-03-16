"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - Fix for missing types in recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from "recharts";
import { ChartDataItem } from '@/types/merger';
import { format } from 'date-fns';

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
    color: "#1B3B6F", // Navy blue (changed from green)
    barColor: "#1B3B6F",
  }
};

interface MergerChartProps {
  data: ChartDataItem[];
  onBarClick: (data: any) => void;
  selectedMonth: string | null;
}

export function MergerChart({ data, onBarClick, selectedMonth }: MergerChartProps) {
  // Filter data to only include months from August 2024 onwards
  const filteredData = React.useMemo(() => {
    // Define the starting month (August 2024)
    const startMonth = '2024-08';
    
    // Handle case where data is undefined
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    // Filter data to only include months from startMonth onwards
    return data.filter(item => item.month >= startMonth);
  }, [data]);
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 mt-1">
            <p className="text-sm">
              <span style={{ color: '#10B981' }}>●</span> Cleared: {data.cleared}
            </p>
            <p className="text-sm">
              <span style={{ color: '#3B82F6' }}>●</span> Cleared with Commitments: {data.cleared_with_commitments}
            </p>
            <p className="text-sm">
              <span style={{ color: '#EF4444' }}>●</span> Blocked: {data.blocked}
            </p>
            <p className="text-sm">
              <span style={{ color: '#FBBF24' }}>●</span> Under Review: {data.under_review}
            </p>
            <div className="w-full h-px bg-gray-200 my-1" />
            <p className="text-sm font-medium">
              Total: {data.total}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[350px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={filteredData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 50,
          }}
          barCategoryGap={10}
          barGap={0}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={40} 
            iconType="circle"
            align="center"
            wrapperStyle={{ 
              paddingTop: 15,
              margin: '0 auto',
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              gap: '16px'
            }}
            formatter={(value) => {
              const formattedValue = value.replace(/_/g, ' ');
              return formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1);
            }}
          />
          <Bar 
            dataKey="cleared" 
            name="Cleared" 
            stackId="a" 
            fill="#10B981" 
            onClick={onBarClick} 
            className={`cursor-pointer`} 
          />
          <Bar 
            dataKey="cleared_with_commitments" 
            name="Cleared with Commitments" 
            stackId="a" 
            fill="#3B82F6" 
            onClick={onBarClick} 
            className={`cursor-pointer`} 
          />
          <Bar 
            dataKey="blocked" 
            name="Blocked" 
            stackId="a" 
            fill="#EF4444" 
            onClick={onBarClick} 
            className={`cursor-pointer`} 
          />
          <Bar 
            dataKey="under_review" 
            name="Under Review" 
            stackId="a" 
            fill="#FBBF24" 
            onClick={onBarClick} 
            className={`cursor-pointer`} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 