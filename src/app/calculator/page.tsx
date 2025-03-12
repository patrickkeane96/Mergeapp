"use client";

import { BusinessDaysCalculator } from "@/components/business-days-calculator";
import { useState } from "react";
import { parseISO } from "date-fns";

export default function CalculatorPage() {
  // State to track clicks on the word "accounting"
  const [secretClickCount, setSecretClickCount] = useState(0);
  
  // Secret feature handler
  const handleSecretFeature = () => {
    setSecretClickCount(prev => {
      const newCount = prev + 1;
      
      // When clicked twice, trigger the secret feature
      if (newCount === 2) {
        // Reset counter after triggering
        setTimeout(() => setSecretClickCount(0), 300);
        
        // Access the BusinessDaysCalculator component through a custom event
        const event = new CustomEvent('secret-feature-triggered', {
          detail: {
            filingDate: parseISO("2025-01-06"),
            stopClockEnabled: true,
            stopClockDate: parseISO("2025-02-26"),
            stopClockDuration: 4
          }
        });
        document.dispatchEvent(event);
      }
      
      return newCount;
    });
  };

  // Split the text to make only "accounting" clickable
  const beforeText = "Calculate key merger control milestones based on filing date, ";
  const secretWord = "accounting";
  const afterText = " for business days only.";

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Business Days Calculator</h1>
      <p className="text-muted-foreground mb-8">
        {beforeText}
        <span 
          onDoubleClick={handleSecretFeature}
          style={{ cursor: 'text' }} // Keep default text cursor to avoid hinting at clickability
        >
          {secretWord}
        </span>
        {afterText}
      </p>
      <BusinessDaysCalculator />
    </div>
  );
} 