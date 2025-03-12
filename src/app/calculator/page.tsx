import { BusinessDaysCalculator } from "@/components/business-days-calculator";

export default function CalculatorPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Business Days Calculator</h1>
      <p className="text-muted-foreground mb-8">
        Calculate key merger control milestones based on filing date, accounting for business days only.
      </p>
      <BusinessDaysCalculator />
    </div>
  );
} 