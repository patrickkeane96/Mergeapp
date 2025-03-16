"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface PhaseProportionBarProps {
  phaseData: {
    phase1: number;
    phase2: number;
    total: number;
    phase1Percentage: number;
    phase2Percentage: number;
  }
}

export function PhaseProportionBar({ phaseData }: PhaseProportionBarProps) {
  const hasData = phaseData.total > 0;
  
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <h3 className="text-base font-medium mb-4">Phase Distribution</h3>
        
        {hasData ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Phase 1</span>
              <span className="text-sm font-medium">Phase 2</span>
            </div>
            
            <div className="relative h-12 rounded-lg overflow-hidden border flex">
              <div 
                className="bg-[#1B3B6F] flex items-center justify-center text-white"
                style={{ width: `${phaseData.phase1Percentage}%` }}
              >
                <span className="text-sm font-medium">
                  {phaseData.phase1Percentage}%
                </span>
              </div>
              <div 
                className="bg-[#90CAF9] flex items-center justify-center text-blue-900"
                style={{ width: `${phaseData.phase2Percentage}%` }}
              >
                <span className="text-sm font-medium">
                  {phaseData.phase2Percentage}%
                </span>
              </div>
            </div>
            
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">{phaseData.phase1}</span> cases
              </div>
              <div>
                <span className="font-medium">{phaseData.phase2}</span> cases
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{phaseData.phase2Percentage}%</span> of cases require in-depth Phase 2 review
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No completed reviews to analyze
          </div>
        )}
      </CardContent>
    </Card>
  );
} 