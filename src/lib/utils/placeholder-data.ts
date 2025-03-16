import { Merger, MergerOutcome } from "@/types/merger";

// Generate placeholder data for mergers
export const generatePlaceholderData = (): Merger[] => {
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
      target: `Target Company ${i + 1}`,
      acquirer: `Acquirer Company ${i + 1}`,
      startDate,
      endDate: endDate || undefined,
      industry: industries[Math.floor(Math.random() * industries.length)] || "Other",
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      outcome,
      hasNotifications,
      isFollowed
    });
  }
  
  return mergers;
}; 