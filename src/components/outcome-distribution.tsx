"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - Fix for missing types in recharts
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Merger, MergerOutcome } from '@/types/merger';
import { PieChartIcon } from 'lucide-react';

interface OutcomeData {
  name: string;
  value: number;
  outcome: MergerOutcome;
}

interface OutcomeDistributionProps {
  mergers: Merger[];
}

// Outcome configuration (for consistent colors and labels)
const outcomeConfig = {
  under_review: {
    label: "Under Review",
    color: "#FBBF24", // Yellow
  },
  cleared: {
    label: "Cleared",
    color: "#10B981", // Green
  },
  blocked: {
    label: "Blocked",
    color: "#EF4444", // Red
  },
  cleared_with_commitments: {
    label: "Cleared with Commitments",
    color: "#1B3B6F", // Blue (primary)
  }
};

export function OutcomeDistribution({ mergers }: OutcomeDistributionProps) {
  // Filter out non-decided mergers for completed outcomes
  const completedMergers = React.useMemo(() => 
    mergers.filter(merger => merger.outcome !== 'under_review'),
  [mergers]);
  
  // Compute outcome distribution
  const outcomeData: OutcomeData[] = React.useMemo(() => {
    const outcomes: Record<string, number> = {};
    
    // Initialize all outcome types with zero
    Object.keys(outcomeConfig).forEach(outcome => {
      if (outcome !== 'under_review') {
        outcomes[outcome] = 0;
      }
    });
    
    // Count mergers by outcome
    completedMergers.forEach(merger => {
      // Check if this is a known outcome
      if (Object.keys(outcomeConfig).includes(merger.outcome)) {
        outcomes[merger.outcome] = (outcomes[merger.outcome] || 0) + 1;
      } else {
        console.warn(`Unknown outcome type: ${merger.outcome}`);
      }
    });
    
    // Convert to array format for chart
    return Object.entries(outcomes)
      .map(([outcome, count]) => ({
        name: outcomeConfig[outcome as MergerOutcome]?.label || `Unknown (${outcome})`,
        value: count,
        outcome: outcome as MergerOutcome
      }))
      .filter(item => item.value > 0);
  }, [completedMergers]);
  
  // Calculate blockage rate and intervention rate
  const blockageRate = React.useMemo(() => {
    if (completedMergers.length === 0) return 0;
    const blocked = completedMergers.filter(m => m.outcome === 'blocked').length;
    return Math.round((blocked / completedMergers.length) * 100);
  }, [completedMergers]);
  
  const interventionRate = React.useMemo(() => {
    if (completedMergers.length === 0) return 0;
    const interventions = completedMergers.filter(
      m => m.outcome === 'blocked' || m.outcome === 'cleared_with_commitments'
    ).length;
    return Math.round((interventions / completedMergers.length) * 100);
  }, [completedMergers]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / completedMergers.length) * 100).toFixed(1);
      
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium">{data.name}</p>
          <div className="space-y-1 mt-1">
            <p className="text-sm">
              <span className="font-medium">{data.value}</span> reviews ({percentage}%)
            </p>
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
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Outcome Distribution
        </CardTitle>
        <CardDescription>
          Analysis of completed merger review outcomes
          {mergers.length !== completedMergers.length && (
            <span className="ml-1">({completedMergers.length} completed of {mergers.length} total)</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {completedMergers.length > 0 ? (
          <div className="flex flex-col md:flex-row gap-6 mb-4">
            <div className="flex-1 md:w-1/3">
              <div className="flex flex-col gap-4">
                <div className="border rounded-lg p-4 flex flex-col items-center justify-center bg-primary/5">
                  <div className="text-sm text-muted-foreground mb-2">Blockage Rate</div>
                  <div className="text-4xl font-bold text-red-600">
                    {blockageRate}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    of mergers are blocked
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 flex flex-col items-center justify-center bg-primary/5">
                  <div className="text-sm text-muted-foreground mb-2">Intervention Rate</div>
                  <div className="text-4xl font-bold text-primary">
                    {interventionRate}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    either blocked or with commitments
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 flex flex-col items-center justify-center bg-primary/5">
                  <div className="text-sm text-muted-foreground mb-2">Total Completed</div>
                  <div className="text-4xl font-bold">
                    {completedMergers.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    reviews with final outcome
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 md:w-2/3 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    innerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {outcomeData.map((entry) => (
                      <Cell 
                        key={`cell-${entry.outcome}`} 
                        fill={outcomeConfig[entry.outcome]?.color || "#CCCCCC"} 
                        stroke="white" 
                        strokeWidth={1} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle" 
                    formatter={(value) => <span className="text-sm">{value}</span>}
                    iconSize={10}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No completed reviews to display outcome distribution
          </div>
        )}
      </CardContent>
    </Card>
  );
} 