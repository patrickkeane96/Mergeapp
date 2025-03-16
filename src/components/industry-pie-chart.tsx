"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - Fix for missing types in recharts
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Merger } from '@/types/merger';

// Color palette that matches the Merger Reviews by Month chart with additional complementary colors
const COLORS = [
  '#FBBF24', // Yellow (Under Review)
  '#10B981', // Green (Cleared)
  '#EF4444', // Red (Blocked)
  '#1B3B6F', // Navy blue (Cleared with Commitments)
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#A855F7', // Violet
  '#D946EF', // Fuchsia
];

interface IndustryChartData {
  name: string;
  value: number;
}

interface IndustryPieChartProps {
  mergers: Merger[];
  onIndustryClick?: (industry: string) => void;
}

export function IndustryPieChart({ mergers, onIndustryClick }: IndustryPieChartProps) {
  // Group mergers by industry and count
  const industryData: IndustryChartData[] = React.useMemo(() => {
    const countByIndustry: Record<string, number> = {};
    
    mergers.forEach(merger => {
      if (!countByIndustry[merger.industry]) {
        countByIndustry[merger.industry] = 0;
      }
      countByIndustry[merger.industry]++;
    });
    
    // Convert to array and sort by count (descending)
    return Object.entries(countByIndustry)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [mergers]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / mergers.length) * 100).toFixed(1);
      const colorIndex = industryData.findIndex(item => item.name === data.name) % COLORS.length;
      
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ background: `${COLORS[colorIndex]}` }}
            />
            <p className="font-semibold">{data.name}</p>
          </div>
          <div className="space-y-1 mt-1 pl-5">
            <p className="text-sm">
              <span className="font-medium">{data.value}</span> reviews ({percentage}%)
            </p>
            {onIndustryClick && (
              <p className="text-xs text-muted-foreground mt-1 italic">Click to filter by this industry</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Only show label for segments with more than 5% share
    if (percent < 0.05) return null;
    
    return (
      <>
        {/* Shadow effect for better readability */}
        <text 
          x={x} 
          y={y} 
          fill="rgba(0,0,0,0.5)" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          fontSize={12}
          fontWeight="bold"
          dx={0.5}
          dy={0.5}
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        <text 
          x={x} 
          y={y} 
          fill="white" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          fontSize={12}
          fontWeight="bold"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </>
    );
  };

  const handlePieClick = (data: any, index: number) => {
    if (onIndustryClick) {
      onIndustryClick(data.name);
    }
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {COLORS.map((color, index) => (
              <linearGradient key={`gradient-${index}`} id={`colorGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.8} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={industryData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            innerRadius={40}
            paddingAngle={2}
            dataKey="value"
            onClick={handlePieClick}
            isAnimationActive={true}
            animationDuration={500}
            className={onIndustryClick ? "cursor-pointer" : ""}
          >
            {industryData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#colorGradient-${index % COLORS.length})`} 
                stroke="white" 
                strokeWidth={1.5}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            layout="vertical" 
            align="right" 
            verticalAlign="middle" 
            formatter={(value) => <span className="text-sm font-medium">{value}</span>}
            iconSize={12}
            iconType="circle"
            wrapperStyle={{ paddingLeft: 20 }}
            onClick={(data) => onIndustryClick && onIndustryClick(data.value)}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 