"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MergerChart } from "@/components/merger-chart";
import { ChartDataItem, Merger, MergerOutcome } from "@/types/merger";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart4, Clock, TrendingUp, PieChart, Activity, Filter, FilterX, X } from "lucide-react";
import { differenceInBusinessDays } from "date-fns";
import { StatsCard } from "@/components/stats-card";
import { IndustryPieChart } from "@/components/industry-pie-chart";
import { CombinedReviewTime } from "@/components/combined-review-time";
import { OutcomeDistribution } from "@/components/outcome-distribution";
import { ReviewTimeTrend } from "@/components/review-time-trend";
import { PhaseProportionBar } from "@/components/phase-proportion-bar";
import { ReviewTimeByIndustry } from "@/components/review-time-by-industry";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useMergers } from "@/lib/hooks/useMergers";

export default function StatisticsPage() {
  const { mergers: allMergers, loading } = useMergers();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  // Get unique industries
  const industries = useMemo(() => {
    const uniqueIndustries = new Set<string>();
    allMergers.forEach(merger => {
      if (merger.industry) {
        uniqueIndustries.add(merger.industry);
      }
    });
    return Array.from(uniqueIndustries).sort();
  }, [allMergers]);

  // Apply industry filter
  const filteredMergers = useMemo(() => {
    if (!selectedIndustry) return allMergers;
    return allMergers.filter(merger => merger.industry === selectedIndustry);
  }, [allMergers, selectedIndustry]);
  
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
    filteredMergers.forEach(merger => {
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
        monthData[month] = {
          under_review: 0,
          cleared: 0,
          blocked: 0,
          cleared_with_commitments: 0,
          total: 0
        };
      }
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
  }, [filteredMergers]);
  
  // Calculate total reviews
  const totalReviews = filteredMergers.length;
  
  // Calculate active reviews
  const activeReviews = filteredMergers.filter(m => m.outcome === 'under_review').length;
  
  // Calculate clearance rate
  const clearanceRate = useMemo(() => {
    const completedMergers = filteredMergers.filter(m => m.outcome !== 'under_review');
    if (completedMergers.length === 0) return 0;
    
    const clearedMergers = completedMergers.filter(
      m => m.outcome === 'cleared' || m.outcome === 'cleared_with_commitments'
    ).length;
    
    return Math.round((clearedMergers / completedMergers.length) * 100);
  }, [filteredMergers]);
  
  // Calculate phase 2 reviews
  const phase2Reviews = filteredMergers.filter(m => m.hasPhase2).length;
  
  // Calculate phase proportion data
  const phaseData = useMemo(() => {
    const completedMergers = filteredMergers.filter(merger => 
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
  }, [filteredMergers]);
  
  // Handle chart bar click for analytics
  const handleBarClick = (data: any) => {
    if (selectedMonth === data.month) {
      setSelectedMonth(null); // Toggle off if already selected
    } else {
      setSelectedMonth(data.month);
    }
  };

  // Handle industry slice click in pie chart
  const handleIndustryClick = (industry: string) => {
    setSelectedIndustry(industry);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedIndustry(null);
    setSelectedMonth(null);
  };

  // Filter display section
  const FilterDisplay = () => {
    if (!selectedIndustry) return null;
    
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtered by:</span>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-sm font-medium"
          >
            {selectedIndustry}
            <span className="flex items-center justify-center bg-white text-primary rounded-full w-4 h-4">
              <X className="h-3 w-3" />
            </span>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Merger Statistics</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedIndustry ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 bg-primary text-white hover:bg-primary/90 hover:text-white"
              onClick={clearFilters}
            >
              {selectedIndustry}
              <span className="flex items-center justify-center bg-white text-primary rounded-full w-4 h-4">
                <X className="h-3 w-3" />
              </span>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  Filter by Industry
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                {industries.map(industry => (
                  <DropdownMenuItem 
                    key={industry}
                    onClick={() => setSelectedIndustry(industry)}
                    className="cursor-pointer"
                  >
                    {industry}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Top level metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Reviews" 
          value={totalReviews}
          description="All merger reviews in the system"
          icon={<BarChart4 className="h-5 w-5" />}
          trend={totalReviews > 0 ? { value: 12, positive: true } : undefined}
        />
        
        <StatsCard 
          title="Active Reviews" 
          value={activeReviews}
          description="Currently under assessment"
          icon={<Activity className="h-5 w-5" />}
        />
        
        <StatsCard 
          title="Clearance Rate" 
          value={`${clearanceRate}%`}
          description="Percentage of cleared mergers"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        
        <StatsCard 
          title="Phase 2 Reviews" 
          value={phase2Reviews}
          description="In-depth assessments"
          icon={<Clock className="h-5 w-5" />}
          trend={phase2Reviews > 0 ? { value: 5, positive: false } : undefined}
        />
      </div>
      
      {/* Charts - First row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <BarChart4 className="h-5 w-5 text-primary" />
              Merger Reviews by Month
            </CardTitle>
            <CardDescription>
              Visual breakdown of merger filings and outcomes by month
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-6">
            <MergerChart 
              data={allChartData} 
              onBarClick={handleBarClick}
              selectedMonth={selectedMonth}
            />
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" /> 
              Reviews by Industry
            </CardTitle>
            <CardDescription>
              Distribution of mergers across industry sectors
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-2">
            <IndustryPieChart 
              mergers={allMergers} 
              onIndustryClick={handleIndustryClick}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Review Time Analysis */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4 flex flex-col items-center justify-center bg-primary/5">
              {(() => {
                const completedMergers = filteredMergers.filter(merger => 
                  merger.outcome !== 'under_review' && merger.endDate
                );
                
                if (completedMergers.length === 0) {
                  return (
                    <>
                      <div className="text-sm text-muted-foreground mb-2">Average Review Time</div>
                      <div className="text-5xl font-bold text-primary">-</div>
                      <div className="text-sm text-muted-foreground mt-2">No completed reviews</div>
                    </>
                  );
                }
                
                const totalDays = completedMergers.reduce((sum, merger) => {
                  if (!merger.endDate) return sum;
                  return sum + differenceInBusinessDays(merger.endDate, merger.startDate);
                }, 0);
                
                const average = Math.round(totalDays / completedMergers.length);
                
                return (
                  <>
                    <div className="text-sm text-muted-foreground mb-2">Average Review Time</div>
                    <div className="text-5xl font-bold text-primary">{average}</div>
                    <div className="text-sm text-muted-foreground mt-2">business days</div>
                    <div className="text-xs text-muted-foreground mt-4">
                      Based on {completedMergers.length} completed reviews
                    </div>
                  </>
                );
              })()}
            </div>
            
            <div>
              <PhaseProportionBar phaseData={phaseData} />
            </div>
            
            <div className="md:row-span-2">
              <ReviewTimeByIndustry allMergers={allMergers} />
            </div>
            
            <div className="md:col-span-2">
              <ReviewTimeTrend mergers={filteredMergers} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Outcome distribution */}
      <OutcomeDistribution mergers={filteredMergers} />
      
      {selectedMonth && (
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <BarChart4 className="h-5 w-5 text-primary" />
              Selected Month Details
            </CardTitle>
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
      return 'bg-blue-100 text-blue-800';
  }
} 