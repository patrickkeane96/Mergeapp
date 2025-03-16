"use client";

import React, { useState, useEffect } from 'react';
import { format, differenceInBusinessDays } from "date-fns";
import { Bell, ChevronDown, Check, Star, X, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FollowButton } from '@/components/ui/follow-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Merger } from '@/types/merger';
import { useNotifications } from '@/lib/contexts/NotificationsContext';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Outcome configuration (for consistent colors and labels)
const outcomeConfig = {
  under_review: {
    label: "Under Review",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800"
  },
  cleared: {
    label: "Cleared",
    bgColor: "bg-green-100",
    textColor: "text-green-800"
  },
  blocked: {
    label: "Blocked",
    bgColor: "bg-red-100", 
    textColor: "text-red-800"
  },
  cleared_with_commitments: {
    label: "Cleared with Commitments",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800"
  }
};

// Phase configuration
const phaseConfig = {
  phase1: {
    label: "Phase 1",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800"
  },
  phase2: {
    label: "Phase 2",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800"
  }
};

// Sort options
const sortOptions = [
  { value: 'status', label: 'Status (default)' },
  { value: 'filing_date_desc', label: 'Filing Date (newest first)' },
  { value: 'filing_date_asc', label: 'Filing Date (oldest first)' },
  { value: 'duration_asc', label: 'Duration (shortest first)' },
  { value: 'duration_desc', label: 'Duration (longest first)' },
  { value: 'target_asc', label: 'Target (A-Z)' },
  { value: 'acquirer_asc', label: 'Acquirer (A-Z)' },
  { value: 'industry_asc', label: 'Industry (A-Z)' }
];

// Sort directions
type SortDirection = 'none' | 'asc' | 'desc';

interface SortState {
  column: string;
  direction: SortDirection;
}

interface EnhancedMergerTableProps {
  mergers: Merger[];
  highlightedMergerId: string | null;
  onRowClick: (merger: Merger) => void;
  currentStartIndex: number;
  itemsPerPage: number;
  setCurrentStartIndex: (index: number) => void;
}

export function EnhancedMergerTable({ 
  mergers, 
  highlightedMergerId, 
  onRowClick,
  currentStartIndex,
  itemsPerPage,
  setCurrentStartIndex
}: EnhancedMergerTableProps) {
  const { isIndustryFollowed, followIndustry, unfollowIndustry, showOnlyFollowed } = useNotifications();
  const router = useRouter();
  
  // State for filters and sorting
  const [nameFilter, setNameFilter] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [quickFilter, setQuickFilter] = useState<'recently_active' | 'all' | 'under_review' | 'completed'>('recently_active');
  const [dateFilter, setDateFilter] = useState<'all' | 'last30days' | 'last90days' | 'last6months' | 'lastyear'>('all');
  const [durationFilter, setDurationFilter] = useState<{min: string, max: string}>({min: '', max: ''});
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortState, setSortState] = useState<SortState>({ column: quickFilter === 'recently_active' ? 'recent_activity' : 'status', direction: 'none' });
  
  // Helper function to calculate duration in days
  const calculateDurationDays = (merger: Merger): number => {
    const { startDate, endDate } = merger;
    
    if (endDate) {
      // For completed mergers, show the duration between filing and decision
      return differenceInBusinessDays(endDate, startDate);
    } else {
      // For under review mergers, show the duration since filing
      const today = new Date();
      return differenceInBusinessDays(today, startDate);
    }
  };

  // Helper function to get the most recent timeline event date
  const getLatestActivityDate = (merger: Merger): Date => {
    const events = merger.timelineEvents || [];
    if (events.length === 0) return merger.startDate;
    return new Date(Math.max(...events.map(event => event.date.getTime())));
  };

  // Extract unique industries from mergers
  const industries = Array.from(new Set(mergers.map(merger => merger.industry)));
  
  // Filter mergers based on current filters and quick filter
  const filteredMergers = mergers.filter(merger => {
    // Quick filter
    if (quickFilter === 'under_review' && merger.outcome !== 'under_review') return false;
    if (quickFilter === 'completed' && merger.outcome === 'under_review') return false;
    if (quickFilter === 'recently_active') {
      // Show mergers with activity in the last 30 days
      const latestActivity = getLatestActivityDate(merger);
      const daysSinceActivity = differenceInBusinessDays(new Date(), latestActivity);
      if (daysSinceActivity > 30) return false;
    }

    // Name filter (now checks both target and acquirer)
    const nameMatch = nameFilter === '' || 
      merger.target?.toLowerCase().includes(nameFilter.toLowerCase()) ||
      merger.acquirer?.toLowerCase().includes(nameFilter.toLowerCase());
    
    // Industry filter
    const industryMatch = selectedIndustries.length === 0 || 
      selectedIndustries.includes(merger.industry);
    
    // Updated status filter to handle phase1/phase2
    const statusMatch = selectedStatuses.length === 0 || 
      (merger.outcome === 'under_review' ? 
        (merger.hasPhase2 ? 
          selectedStatuses.includes('under_review_phase2') : 
          selectedStatuses.includes('under_review_phase1')
        ) : 
        selectedStatuses.includes(merger.outcome));
    
    // Date filter
    let dateMatch = true;
    const currentDate = new Date();
    if (dateFilter !== 'all') {
      const startDate = merger.startDate;
      const timeDiff = currentDate.getTime() - startDate.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      
      if (dateFilter === 'last30days' && daysDiff > 30) dateMatch = false;
      else if (dateFilter === 'last90days' && daysDiff > 90) dateMatch = false;
      else if (dateFilter === 'last6months' && daysDiff > 180) dateMatch = false;
      else if (dateFilter === 'lastyear' && daysDiff > 365) dateMatch = false;
    }
    
    // Duration filter
    let durationMatch = true;
    const duration = calculateDurationDays(merger);
    
    if (durationFilter.min && !isNaN(parseInt(durationFilter.min))) {
      durationMatch = durationMatch && duration >= parseInt(durationFilter.min);
    }
    
    if (durationFilter.max && !isNaN(parseInt(durationFilter.max))) {
      durationMatch = durationMatch && duration <= parseInt(durationFilter.max);
    }
    
    return nameMatch && industryMatch && statusMatch && dateMatch && durationMatch;
  });
  
  // Effect to reset pagination when filters change
  useEffect(() => {
    const totalPages = Math.ceil(filteredMergers.length / itemsPerPage);
    const currentPage = Math.floor(currentStartIndex / itemsPerPage);
    
    if (currentPage >= totalPages) {
      setCurrentStartIndex(0);
    }
  }, [nameFilter, selectedIndustries, selectedStatuses, quickFilter, dateFilter, durationFilter, filteredMergers.length, itemsPerPage, currentStartIndex, setCurrentStartIndex]);
  
  // Handle column sort
  const handleSort = (column: string) => {
    setSortState(prev => ({
      column,
      direction: prev.column === column 
        ? prev.direction === 'none' ? 'asc'
        : prev.direction === 'asc' ? 'desc'
        : 'none'
        : 'asc'
    }));
  };

  // Updated sort logic
  const sortedMergers = [...filteredMergers].sort((a, b) => {
    if (quickFilter === 'recently_active' || sortState.column === 'recent_activity') {
      // Sort by most recent activity first
      const aLatest = getLatestActivityDate(a).getTime();
      const bLatest = getLatestActivityDate(b).getTime();
      return bLatest - aLatest;
    }

    // Always sort Phase 1 before Phase 2 for under review mergers
    if (a.outcome === 'under_review' && b.outcome === 'under_review') {
      if (a.hasPhase2 !== b.hasPhase2) {
        return a.hasPhase2 ? 1 : -1;
      }
    }

    if (sortState.direction === 'none') {
      // Default sorting (status based)
      if (a.outcome === 'under_review' && b.outcome !== 'under_review') return -1;
      if (a.outcome !== 'under_review' && b.outcome === 'under_review') return 1;
      return calculateDurationDays(a) - calculateDurationDays(b);
    }

    const direction = sortState.direction === 'asc' ? 1 : -1;
    
    switch (sortState.column) {
      case 'filing_date':
        return direction * (new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      case 'duration':
        return direction * (calculateDurationDays(a) - calculateDurationDays(b));
      case 'target':
        return direction * (a.target || '').localeCompare(b.target || '');
      case 'acquirer':
        return direction * (a.acquirer || '').localeCompare(b.acquirer || '');
      case 'industry':
        return direction * a.industry.localeCompare(b.industry);
      default:
        return 0;
    }
  });
  
  // Handle industry follow
  const handleIndustryFollow = (industry: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isIndustryFollowed(industry)) {
      unfollowIndustry(industry);
    } else {
      followIndustry(industry);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setNameFilter('');
    setSelectedIndustries([]);
    setSelectedStatuses([]);
    setDateFilter('all');
    setDurationFilter({min: '', max: ''});
  };

  // Get status display with phase information
  const getStatusDisplay = (merger: Merger) => {
    if (merger.outcome === 'under_review') {
      return merger.hasPhase2 ? 'Under Review (Phase 2)' : 'Under Review (Phase 1)';
    }
    return outcomeConfig[merger.outcome].label;
  };

  return (
    <div className="border rounded-md">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex-1 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <button 
            className={cn(
              "hover:text-foreground transition-colors",
              quickFilter === 'recently_active' && "text-foreground font-medium"
            )}
            onClick={() => setQuickFilter('recently_active')}
          >
            Recently Active
          </button>
          <span className="text-muted-foreground">|</span>
          <button 
            className={cn(
              "hover:text-foreground transition-colors",
              quickFilter === 'all' && "text-foreground font-medium"
            )}
            onClick={() => setQuickFilter('all')}
          >
            All
          </button>
          <span className="text-muted-foreground">|</span>
          <button 
            className={cn(
              "hover:text-foreground transition-colors",
              quickFilter === 'under_review' && "text-foreground font-medium"
            )}
            onClick={() => setQuickFilter('under_review')}
          >
            Under Review
          </button>
          <span className="text-muted-foreground">|</span>
          <button 
            className={cn(
              "hover:text-foreground transition-colors",
              quickFilter === 'completed' && "text-foreground font-medium"
            )}
            onClick={() => setQuickFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Active filters display */}
      {(nameFilter || selectedIndustries.length > 0 || selectedStatuses.length > 0 || dateFilter !== 'all' || durationFilter.min || durationFilter.max) && (
        <div className="p-3 bg-muted/40 border-b flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">Active filters:</span>
          
          {nameFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Name: {nameFilter}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setNameFilter('')}
              />
            </Badge>
          )}
          
          {selectedIndustries.map(industry => (
            <Badge key={industry} variant="secondary" className="flex items-center gap-1">
              Industry: {industry}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setSelectedIndustries(prev => prev.filter(i => i !== industry))}
              />
            </Badge>
          ))}
          
          {selectedStatuses.map(status => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1">
              Status: {outcomeConfig[status as keyof typeof outcomeConfig].label}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setSelectedStatuses(prev => prev.filter(s => s !== status))}
              />
            </Badge>
          ))}
          
          {dateFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Date: {dateFilter}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setDateFilter('all')}
              />
            </Badge>
          )}
          
          {(durationFilter.min || durationFilter.max) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Duration: {durationFilter.min || '0'}-{durationFilter.max || '∞'} days
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setDurationFilter({min: '', max: ''})}
              />
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={resetFilters}
            className="ml-auto"
          >
            Reset all
          </Button>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="relative cursor-pointer" onClick={() => handleSort('target')}>
              Target
              <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                <ArrowUpDown className={cn(
                  "h-3.5 w-3.5",
                  sortState.column === 'target' && sortState.direction !== 'none' && "text-primary"
                )} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <div className="p-2">
                    <Input 
                      placeholder="Filter by target or acquirer..." 
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableHead>
            <TableHead className="relative cursor-pointer" onClick={() => handleSort('acquirer')}>
              Acquirer
              <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                <ArrowUpDown className={cn(
                  "h-3.5 w-3.5",
                  sortState.column === 'acquirer' && sortState.direction !== 'none' && "text-primary"
                )} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <div className="p-2">
                    <Input 
                      placeholder="Filter by target or acquirer..." 
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableHead>
            <TableHead className="relative cursor-pointer" onClick={() => handleSort('industry')}>
              Industry
              <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                <ArrowUpDown className={cn(
                  "h-3.5 w-3.5",
                  sortState.column === 'industry' && sortState.direction !== 'none' && "text-primary"
                )} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {industries.map(industry => (
                    <DropdownMenuCheckboxItem
                      key={industry}
                      checked={selectedIndustries.includes(industry)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIndustries(prev => [...prev, industry]);
                        } else {
                          setSelectedIndustries(prev => prev.filter(i => i !== industry));
                        }
                      }}
                    >
                      {industry}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedIndustries([])}>
                    Clear All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableHead>
            <TableHead className="relative cursor-pointer" onClick={() => handleSort('filing_date')}>
              Filing Date
              <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                <ArrowUpDown className={cn(
                  "h-3.5 w-3.5",
                  sortState.column === 'filing_date' && sortState.direction !== 'none' && "text-primary"
                )} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setDateFilter('all')}>
                    <Check className={cn("mr-2 h-4 w-4", dateFilter === 'all' ? "opacity-100" : "opacity-0")} />
                    All Time
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter('last30days')}>
                    <Check className={cn("mr-2 h-4 w-4", dateFilter === 'last30days' ? "opacity-100" : "opacity-0")} />
                    Last 30 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter('last90days')}>
                    <Check className={cn("mr-2 h-4 w-4", dateFilter === 'last90days' ? "opacity-100" : "opacity-0")} />
                    Last 90 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter('last6months')}>
                    <Check className={cn("mr-2 h-4 w-4", dateFilter === 'last6months' ? "opacity-100" : "opacity-0")} />
                    Last 6 months
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter('lastyear')}>
                    <Check className={cn("mr-2 h-4 w-4", dateFilter === 'lastyear' ? "opacity-100" : "opacity-0")} />
                    Last year
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableHead>
            <TableHead className="relative cursor-pointer" onClick={() => handleSort('status')}>
              Status
              <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                <ArrowUpDown className={cn(
                  "h-3.5 w-3.5",
                  sortState.column === 'status' && sortState.direction !== 'none' && "text-primary"
                )} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes('under_review_phase1')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStatuses(prev => [...prev, 'under_review_phase1']);
                      } else {
                        setSelectedStatuses(prev => prev.filter(s => s !== 'under_review_phase1'));
                      }
                    }}
                  >
                    Under Review (Phase 1)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes('under_review_phase2')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStatuses(prev => [...prev, 'under_review_phase2']);
                      } else {
                        setSelectedStatuses(prev => prev.filter(s => s !== 'under_review_phase2'));
                      }
                    }}
                  >
                    Under Review (Phase 2)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  {Object.entries(outcomeConfig)
                    .filter(([key]) => key !== 'under_review')
                    .map(([key, config]) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={selectedStatuses.includes(key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStatuses(prev => [...prev, key]);
                          } else {
                            setSelectedStatuses(prev => prev.filter(s => s !== key));
                          }
                        }}
                      >
                        {config.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedStatuses([])}>
                    Clear All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableHead>
            <TableHead className="relative cursor-pointer" onClick={() => handleSort('duration')}>
              Duration
              <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                <ArrowUpDown className={cn(
                  "h-3.5 w-3.5",
                  sortState.column === 'duration' && sortState.direction !== 'none' && "text-primary"
                )} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <div className="p-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Min:</span>
                      <Input 
                        type="number"
                        placeholder="Min days" 
                        value={durationFilter.min}
                        onChange={(e) => setDurationFilter(prev => ({...prev, min: e.target.value}))}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Max:</span>
                      <Input 
                        type="number"
                        placeholder="Max days" 
                        value={durationFilter.max}
                        onChange={(e) => setDurationFilter(prev => ({...prev, max: e.target.value}))}
                        className="w-full"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setDurationFilter({min: '', max: ''})}
                    >
                      Clear
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMergers.slice(currentStartIndex, currentStartIndex + rowsPerPage).map((merger) => (
            <TableRow 
              key={merger.id}
              id={`merger-row-${merger.id}`}
              className={cn(
                highlightedMergerId === merger.id && "bg-primary/5",
                "transition-colors hover:bg-muted/50 cursor-pointer"
              )}
              onClick={() => onRowClick(merger)}
            >
              <TableCell>
                <div className="font-medium">{merger.target}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{merger.acquirer}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <span>{merger.industry}</span>
                  {isIndustryFollowed(merger.industry) && (
                    <Bell className="h-3 w-3 ml-1 text-primary" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                {format(merger.startDate, "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    "inline-flex w-auto px-2 py-0.5 text-xs",
                    outcomeConfig[merger.outcome].bgColor,
                    outcomeConfig[merger.outcome].textColor
                  )}
                >
                  {getStatusDisplay(merger)}
                </Badge>
              </TableCell>
              <TableCell>
                {calculateDurationDays(merger)} business days
              </TableCell>
              <TableCell className="text-right">
                <FollowButton merger={merger} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min(sortedMergers.length, currentStartIndex + 1)} to {Math.min(sortedMergers.length, currentStartIndex + rowsPerPage)} of {sortedMergers.length} mergers
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStartIndex(Math.max(0, currentStartIndex - rowsPerPage))}
            disabled={currentStartIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStartIndex(Math.min(sortedMergers.length - 1, currentStartIndex + rowsPerPage))}
            disabled={currentStartIndex + rowsPerPage >= sortedMergers.length}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 