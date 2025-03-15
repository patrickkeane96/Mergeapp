"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MergerChart } from "@/components/merger-chart";
import { ChartDataItem, Merger, MergerOutcome } from "@/types/merger";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Generate placeholder data for demonstration
const generatePlaceholderData = (): Merger[] => {
  const industries = [
    "Technology",
    "Healthcare",
    "Energy",
    "Financial Services",
    "Retail",
    "Media",
    "Telecommunications",
    "Manufacturing",
    "Consumer Goods",
    "Transportation"
  ];
  
  const descriptions = [
    "Horizontal merger between two major competitors in the market.",
    "Vertical integration of supply chain components.",
    "Conglomerate merger expanding into adjacent markets.",
    "Acquisition of a startup with innovative technology.",
    "Merger of equals to achieve market consolidation.",
    "Strategic acquisition to enter new geographic markets.",
    "Merger to achieve economies of scale and cost synergies.",
    "Acquisition to diversify product portfolio.",
    "Merger to strengthen market position against emerging competitors.",
    "Acquisition of distressed assets at favorable valuation."
  ];
  
  const outcomes: MergerOutcome[] = ['under_review', 'cleared', 'blocked', 'cleared_with_commitments'];
  
  const mergers: Merger[] = [];
  const currentDate = new Date();
  
  // Generate 50 random mergers over the past 2 years
  for (let i = 0; i < 50; i++) {
    const startMonthsAgo = Math.floor(Math.random() * 24); // Random start date within past 24 months
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - startMonthsAgo,
      Math.floor(Math.random() * 28) + 1
    );
    
    const durationMonths = Math.floor(Math.random() * 6) + 1; // 1-6 months duration
    const endDate = i % 10 === 0 ? null : new Date(startDate);
    if (endDate) endDate.setMonth(endDate.getMonth() + durationMonths);
    
    // Determine outcome based on date
    let outcome: MergerOutcome = 'under_review';
    if (endDate) {
      // Distribution: 60% cleared, 15% blocked, 25% cleared with commitments
      const rand = Math.random();
      if (rand < 0.6) outcome = 'cleared';
      else if (rand < 0.75) outcome = 'blocked';
      else outcome = 'cleared_with_commitments';
    }
    
    // For ongoing mergers, always 'under_review'
    if (!endDate) outcome = 'under_review';
    
    // Add some future notification features
    const hasNotifications = Math.random() > 0.7;
    const isFollowed = Math.random() > 0.8;
    
    mergers.push({
      id: `merger-${i}`,
      name: `Merger Case ${i + 1}`,
      startDate,
      endDate,
      industry: industries[Math.floor(Math.random() * industries.length)] || "Other",
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      outcome,
      hasNotifications,
      isFollowed
    });
  }
  
  return mergers;
};

export default function StatisticsPage() {
  const allMergers = useMemo(() => generatePlaceholderData(), []);
  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null);
  
  // Create chart data by grouping mergers by month and outcome
  const allChartData = useMemo(() => {
    const data: ChartDataItem[] = [];
    const monthData: Record<string, { 
      under_review: number, 
      cleared: number, 
      blocked: number, 
      cleared_with_commitments: number,
      total: number 
    }> = {};
    
    // Count mergers by month and outcome
    allMergers.forEach(merger => {
      const month = `${merger.startDate.getFullYear()}-${String(merger.startDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthData[month]) {
        monthData[month] = {
          under_review: 0,
          cleared: 0,
          blocked: 0,
          cleared_with_commitments: 0,
          total: 0
        };
      }
      
      monthData[month][merger.outcome]++;
      monthData[month].total++;
    });
    
    // Sort months chronologically
    const sortedMonths = Object.keys(monthData).sort();
    
    // Create chart data array
    sortedMonths.forEach(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const name = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      data.push({
        name,
        month,
        under_review: monthData[month].under_review,
        cleared: monthData[month].cleared,
        blocked: monthData[month].blocked,
        cleared_with_commitments: monthData[month].cleared_with_commitments,
        total: monthData[month].total
      });
    });
    
    return data;
  }, [allMergers]);
  
  // Handle chart bar click for analytics
  const handleBarClick = (data: any) => {
    if (selectedMonth === data.month) {
      setSelectedMonth(null); // Toggle off if already selected
    } else {
      setSelectedMonth(data.month);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Merger Statistics</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Merger Activity Overview</CardTitle>
          <CardDescription>
            Visual breakdown of merger filings and outcomes by month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MergerChart 
            chartData={allChartData} 
            onBarClick={handleBarClick}
            selectedMonth={selectedMonth}
          />
        </CardContent>
      </Card>
      
      {selectedMonth && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Month Details</CardTitle>
            <CardDescription>
              Detailed breakdown for {allChartData.find(item => item.month === selectedMonth)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries({
                'under_review': 'Under Review',
                'cleared': 'Cleared',
                'blocked': 'Blocked',
                'cleared_with_commitments': 'Cleared with Commitments'
              }).map(([key, label]) => {
                const monthData = allChartData.find(item => item.month === selectedMonth);
                const count = monthData ? monthData[key as keyof ChartDataItem] as number : 0;
                const total = monthData?.total || 1;
                const percentage = Math.round((count / total) * 100);
                
                return (
                  <Card key={key} className="overflow-hidden">
                    <CardHeader className={`p-4 ${getColorForOutcome(key as MergerOutcome)}`}>
                      <CardTitle className="text-md">{label}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-muted-foreground">{percentage}% of total</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getColorForOutcome(outcome: MergerOutcome): string {
  switch (outcome) {
    case 'under_review':
      return 'bg-yellow-100 text-yellow-800';
    case 'cleared':
      return 'bg-green-100 text-green-800';
    case 'blocked':
      return 'bg-red-100 text-red-800';
    case 'cleared_with_commitments':
      return 'bg-emerald-100 text-emerald-800';
  }
} 