"use client";

import React, { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addMonths, format, addBusinessDays, differenceInBusinessDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Bell, RefreshCw, Zap, ChevronDown, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowIndustryButton } from "@/components/ui/follow-industry-button";
import { useNotifications } from "@/lib/contexts/NotificationsContext";
import { Merger, MergerOutcome, TimelineEvent, ChartDataItem } from "@/types/merger";
import { DateRange } from "react-day-picker";
import { MergerDetailsSidebar } from "@/components/merger-details-sidebar";
import { MergerChart } from "@/components/merger-chart";
import { MergerTable } from "@/components/merger-table";
import { RecentUpdates } from "@/components/recent-updates";
import { NewsModule } from "@/components/news-module";
import { FollowedMergersModule } from "@/components/followed-mergers-module";
import { EnhancedMergerTable } from "@/components/enhanced-merger-table";
import { MergerDetailsModal } from '@/components/merger-details-modal';
import { AskSearchModal } from '@/components/ask-search-modal';
import { generateTimelineEvents } from "@/lib/utils/merger-utils";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMergers } from "@/lib/hooks/useMergers";

// Outcome configuration (for consistent colors and labels)
const outcomeConfig = {
  under_review: {
    label: "Under Review",
    color: "#FBBF24", // Yellow
    barColor: "#FBBF24",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800"
  },
  cleared: {
    label: "Cleared",
    color: "#10B981", // Green
    barColor: "#10B981",
    bgColor: "bg-green-100",
    textColor: "text-green-800"
  },
  blocked: {
    label: "Blocked",
    color: "#EF4444", // Red
    barColor: "#EF4444",
    bgColor: "bg-red-100", 
    textColor: "text-red-800"
  },
  cleared_with_commitments: {
    label: "Cleared with Commitments",
    color: "#3B82F6", // Blue
    barColor: "#3B82F6",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800"
  }
};

// Create a client component that uses useSearchParams
function DashboardContent() {
  const searchParams = useSearchParams();
  const highlightedMergerId = searchParams.get('mergerId');
  
  // Get notification context
  const { 
    notifications,
    isMergerFollowed, 
    isIndustryFollowed, 
    showOnlyFollowed, 
    toggleShowOnlyFollowed,
    addNotification,
    followMerger,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    mergers
  } = useNotifications();

  // Replace the placeholder data with real data from Supabase
  const { 
    mergers: supabaseMergers, 
    loading, 
    error, 
    fetchMergers, 
    toggleFollowMerger 
  } = useMergers();
  
  // Use the mergers from Supabase instead of generating placeholder data
  // const data = useMemo(() => generatePlaceholderData(), []);
  
  const [displayMergers, setDisplayMergers] = useState<Merger[]>(supabaseMergers);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMerger, setSelectedMerger] = useState<Merger | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);

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
    supabaseMergers.forEach(merger => {
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
  }, [supabaseMergers]);
  
  // Handle chart bar click to filter table
  const handleBarClick = (data: any) => {
    if (selectedMonth === data.month) {
      setSelectedMonth(null); // Toggle off if already selected
    } else {
      setSelectedMonth(data.month);
      setActiveTab("dashboard"); // Switch to dashboard tab when filtering
    }
  };
  
  // Handle row click to show merger details
  const handleRowClick = (merger: Merger) => {
    setSelectedMerger(merger);
    setTimelineEvents(generateTimelineEvents(merger));
    setIsModalOpen(true);
  };
  
  // Close sidebar with animation
  const closeSidebar = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setSelectedMerger(null);
      setTimelineEvents([]);
      setIsModalOpen(false);
      setIsModalClosing(false);
    }, 200);
  };
  
  // Filter mergers based on criteria
  const filteredMergers = useMemo(() => {
    return displayMergers.filter((merger) => {
      // Apply followed mergers filter
      if (showOnlyFollowed && !isMergerFollowed(merger.id)) {
        return false;
      }
      
      // Apply industry filter
      if (selectedIndustry && merger.industry !== selectedIndustry) {
        return false;
      }

      // Apply outcome filter
      if (selectedOutcome !== "all" && merger.outcome !== selectedOutcome) {
        return false;
      }

      // Apply date range filter
      if (dateRange.from && dateRange.to) {
        const mergerDate = merger.startDate;
        if (
          mergerDate < dateRange.from ||
          mergerDate > dateRange.to
        ) {
          return false;
        }
      }

      // Apply search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          merger.target.toLowerCase().includes(query) ||
          merger.acquirer.toLowerCase().includes(query) ||
          merger.description?.toLowerCase().includes(query) ||
          merger.industry.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [displayMergers, selectedIndustry, selectedOutcome, dateRange, searchQuery, showOnlyFollowed, isMergerFollowed]);
  
  // Get unique industries for the dropdown
  const industries = useMemo(() => {
    const uniqueIndustries = new Set<string>();
    supabaseMergers.forEach(merger => uniqueIndustries.add(merger.industry));
    return Array.from(uniqueIndustries).sort();
  }, [supabaseMergers]);
  
  // If a mergerId is provided in the URL, scroll to that merger and follow it
  useEffect(() => {
    if (highlightedMergerId) {
      // Find the merger in our data
      const highlightedMerger = displayMergers.find(m => m.id === highlightedMergerId);
      
      if (highlightedMerger) {
        // Follow the merger if not already followed
        if (!isMergerFollowed(highlightedMergerId)) {
          followMerger(highlightedMergerId);
        }
        
        // Show the merger details
        handleRowClick(highlightedMerger);
        
        // Switch to dashboard tab
        setActiveTab("dashboard");
      }
    }
  }, [highlightedMergerId, displayMergers, isMergerFollowed, followMerger]);

  // Function to simulate a status change and create a notification
  const simulateStatusChange = (merger: Merger) => {
    // Define possible new outcomes based on current outcome
    const possibleOutcomes: Record<MergerOutcome, MergerOutcome[]> = {
      under_review: ['cleared', 'blocked', 'cleared_with_commitments'],
      cleared: ['under_review'], // Rarely happens but possible
      blocked: ['under_review'], // Could be appealed
      cleared_with_commitments: ['under_review', 'cleared'] // Commitments could be removed
    };
    
    const currentOutcome = merger.outcome;
    const newOutcomes = possibleOutcomes[currentOutcome];
    const newOutcome = newOutcomes[Math.floor(Math.random() * newOutcomes.length)];
    
    // Don't actually update the merger in the list, just create a notification
    // about a hypothetical status change
    
    // Update the notification creation in simulateStatusChange function
    const getStatusMessage = (outcome: MergerOutcome) => {
      switch(outcome) {
        case 'under_review': return 'Phase 2 commenced';
        case 'cleared': return 'Cleared';
        case 'blocked': return 'Blocked';
        case 'cleared_with_commitments': return 'Cleared with commitments';
        default: return outcome;
      }
    };

    // Create a notification about the change
    addNotification({
      type: 'status_change',
      title: `Merger Status Updated: ${merger.name}`,
      message: getStatusMessage(newOutcome),
      mergerId: merger.id,
      industry: merger.industry,
      outcome: newOutcome
    });
  };

  // Simulate NOCC issuance
  const simulateNOCCIssuance = (merger: Merger) => {
    // Only applicable for under_review mergers
    if (merger.outcome !== 'under_review') return;
    
    // Add notification
    addNotification({
      type: 'nocc_issued',
      title: `NOCC Issued for ${merger.name}`,
      message: 'A Notice of Competition Concerns (NOCC) has been issued, outlining potential competition issues.',
      mergerId: merger.id,
      industry: merger.industry,
      outcome: merger.outcome
    });
  };

  // Simulate random merger updates
  const simulateRandomUpdates = useCallback(() => {
    // Get followed mergers and industries
    const followedMergerIds = displayMergers.filter(m => isMergerFollowed(m.id)).map(m => m.id);
    const followedIndustryNames = industries.filter(i => isIndustryFollowed(i));
    
    // Get mergers from followed industries
    const followedIndustryMergers = displayMergers.filter(m => 
      followedIndustryNames.includes(m.industry) && !followedMergerIds.includes(m.id)
    );
    
    // Combine followed mergers, mergers from followed industries, and some random mergers
    const relevantMergers = [
      ...displayMergers.filter(m => followedMergerIds.includes(m.id)),
      ...followedIndustryMergers,
      ...displayMergers.filter(m => 
        !followedMergerIds.includes(m.id) && 
        !followedIndustryNames.includes(m.industry)
      ).slice(0, 5) // Add 5 random non-followed mergers
    ];
    
    // If no mergers at all, use random mergers
    const mergersToUpdate = relevantMergers.length > 0 
      ? relevantMergers 
      : displayMergers.slice(0, 20); // Use first 20 mergers if none are followed
    
    // Randomly select up to 10 mergers to update
    const numUpdates = Math.min(10, mergersToUpdate.length);
    const shuffled = [...mergersToUpdate].sort(() => 0.5 - Math.random());
    const selectedMergers = shuffled.slice(0, numUpdates);
    
    // Update each selected merger
    selectedMergers.forEach(merger => {
      // 70% chance of status change, 30% chance of NOCC issuance
      if (Math.random() < 0.7) {
        simulateStatusChange(merger);
      } else if (merger.outcome === 'under_review') {
        simulateNOCCIssuance(merger);
      } else {
        simulateStatusChange(merger);
      }
    });
    
    // Switch to notifications tab
    setActiveTab("notifications");
  }, [displayMergers, isMergerFollowed, isIndustryFollowed, industries, simulateStatusChange, simulateNOCCIssuance, setActiveTab]);

  // Sample data generation just for demonstration
  useEffect(() => {
    const interval = setInterval(() => {
      simulateRandomUpdates();
    }, 30000); // Add a random update every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [simulateRandomUpdates]);

  // Update the handleFollowToggle function to use the Supabase API
  const handleFollowToggle = async (id: string, isFollowed: boolean) => {
    try {
      await toggleFollowMerger(id, isFollowed);
      // No need to update the state manually as the useMergers hook handles it
    } catch (error) {
      console.error('Error toggling follow status:', error);
      // Show an error notification
      addNotification({
        title: 'Error',
        message: 'Failed to update follow status',
        type: 'status_change'
      });
    }
  };

  // Update displayMergers when supabaseMergers changes
  useEffect(() => {
    if (supabaseMergers) {
      setDisplayMergers(supabaseMergers);
    }
  }, [supabaseMergers]);

  return (
    <div className="flex-1 space-y-6 p-6 max-w-[1536px] mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Merger Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log("Opening Ask modal");
              setTimeout(() => {
                console.log("Setting isAskModalOpen to true");
                setIsAskModalOpen(true);
                console.log("isAskModalOpen set to true:", isAskModalOpen);
                setSearchQuery(searchQuery + " ");
              }, 100);
            }}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Ask
          </Button>
          <Button variant="outline" onClick={simulateRandomUpdates}>
            <Bell className="h-4 w-4 mr-2" />
            Simulate News
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* News Module */}
        <NewsModule 
          notifications={notifications.slice().sort((a, b) => 
            b.timestamp.getTime() - a.timestamp.getTime()
          )}
          maxItems={5}
        />
        
        {/* Followed Mergers Module */}
        <FollowedMergersModule 
          mergers={displayMergers}
          maxItems={5}
        />
      </div>
      
      {/* Active Mergers Table */}
      <div className="mt-6">
        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center space-y-4">
                <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                <p className="text-lg font-medium">Loading merger data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center space-y-4">
                <p className="text-lg font-medium text-red-500">Error loading merger data</p>
                <Button onClick={() => fetchMergers()}>Retry</Button>
              </div>
            </div>
          ) : (
            <EnhancedMergerTable
              mergers={supabaseMergers}
              highlightedMergerId={highlightedMergerId || null}
              onRowClick={handleRowClick}
              currentStartIndex={currentStartIndex}
              itemsPerPage={itemsPerPage}
              setCurrentStartIndex={setCurrentStartIndex}
              openMergerDetails={handleRowClick}
            />
          )}
        </Card>
      </div>
      
      {/* Merger Details Modal */}
      <MergerDetailsModal
        merger={selectedMerger}
        timelineEvents={timelineEvents}
        isOpen={isModalOpen || isModalClosing}
        onClose={closeSidebar}
      />

      {/* Natural Language Search Modal */}
      <AskSearchModal 
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        allMergers={supabaseMergers}
      />
    </div>
  );
}

// Main dashboard component with Suspense boundary
export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex-1 p-6">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
} 