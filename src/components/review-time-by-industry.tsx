"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Merger } from '@/types/merger';
import { differenceInBusinessDays } from 'date-fns';

interface IndustryReviewTime {
  industry: string;
  avgDays: number;
  count: number;
}

interface ReviewTimeByIndustryProps {
  allMergers: Merger[];
}

export function ReviewTimeByIndustry({ allMergers }: ReviewTimeByIndustryProps) {
  // Calculate average review time by industry
  const industryData: IndustryReviewTime[] = React.useMemo(() => {
    const industryReviewTimes: Record<string, { totalDays: number, count: number }> = {};
    
    // Only include completed mergers with end dates
    const completedMergers = allMergers.filter(merger => 
      merger.outcome !== 'under_review' && merger.endDate
    );
    
    // Group by industry
    completedMergers.forEach(merger => {
      if (!merger.endDate) return;
      
      // Calculate business days
      const days = differenceInBusinessDays(merger.endDate, merger.startDate);
      
      if (!industryReviewTimes[merger.industry]) {
        industryReviewTimes[merger.industry] = { totalDays: 0, count: 0 };
      }
      
      industryReviewTimes[merger.industry].totalDays += days;
      industryReviewTimes[merger.industry].count++;
    });
    
    // Calculate average for each industry and sort by average time (descending)
    return Object.entries(industryReviewTimes)
      .map(([industry, data]) => ({
        industry,
        avgDays: Math.round(data.totalDays / data.count),
        count: data.count
      }))
      .sort((a, b) => b.avgDays - a.avgDays);
  }, [allMergers]);
  
  const hasData = industryData.length > 0;
  
  // Calculate max days for proper scaling
  const maxDays = hasData ? Math.max(...industryData.map(d => d.avgDays)) : 0;

  return (
    <Card className="h-full">
      <CardContent className="p-4 flex flex-col">
        <h3 className="text-base font-medium mb-4">Review Time by Industry</h3>
        
        {hasData ? (
          <div className="space-y-3 flex-grow min-h-[450px]">
            {industryData.map(item => (
              <div key={item.industry} className="relative">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate max-w-[60%]" title={item.industry}>
                    {item.industry}
                  </span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {item.avgDays} days ({item.count} {item.count === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (item.avgDays / maxDays) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[450px] text-muted-foreground">
            No completed reviews to analyze
          </div>
        )}
      </CardContent>
    </Card>
  );
} 