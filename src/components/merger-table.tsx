"use client";

import React, { useState } from 'react';
import { format, differenceInBusinessDays } from "date-fns";
import { Bell, ChevronDown, Check, X, Filter, ArrowUpDown } from 'lucide-react';
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
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-800"
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

interface MergerTableProps {
  mergers: Merger[];
  highlightedMergerId: string | null;
  onRowClick: (merger: Merger) => void;
  currentStartIndex: number;
  itemsPerPage: number;
  setCurrentStartIndex: (index: number) => void;
}

export function MergerTable({ 
  mergers, 
  highlightedMergerId, 
  onRowClick,
  currentStartIndex,
  itemsPerPage,
  setCurrentStartIndex
}: MergerTableProps) {
  const { isIndustryFollowed, showOnlyFollowed } = useNotifications();
  
  // State for filters
  const [nameFilter, setNameFilter] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | 'last30days' | 'last90days' | 'last6months' | 'lastyear'>('all');
  const [durationFilter, setDurationFilter] = useState<{min: string, max: string}>({min: '', max: ''});
  const [sortBy, setSortBy] = useState<string>('status');
  
  // Extract unique industries from mergers
  const industries = Array.from(new Set(mergers.map(merger => merger.industry)));
  
  // Filter mergers based on current filters
  const filteredMergers = mergers.filter(merger => {
    // Name filter
    const nameMatch = nameFilter === '' || 
      merger.target?.toLowerCase().includes(nameFilter.toLowerCase()) ||
      merger.acquirer?.toLowerCase().includes(nameFilter.toLowerCase());
    
    // Industry filter
    const industryMatch = selectedIndustries.length === 0 || 
      selectedIndustries.includes(merger.industry);
    
    // Status filter
    const statusMatch = selectedStatuses.length === 0 || 
      selectedStatuses.includes(merger.outcome);
    
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
  
  // Sort mergers based on selected sort option
  const sortedMergers = [...filteredMergers].sort((a, b) => {
    switch (sortBy) {
      case 'filing_date_desc':
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      case 'filing_date_asc':
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      case 'duration_asc':
        return calculateDurationDays(a) - calculateDurationDays(b);
      case 'duration_desc':
        return calculateDurationDays(b) - calculateDurationDays(a);
      case 'target_asc':
        return (a.target || '').localeCompare(b.target || '');
      case 'acquirer_asc':
        return (a.acquirer || '').localeCompare(b.acquirer || '');
      case 'industry_asc':
        return a.industry.localeCompare(b.industry);
      case 'status':
      default:
        // Sort by status priority (under review first, then others)
        // For under review, sort by duration (shortest first)
        // For others, sort by most recent decision
        if (a.outcome === 'under_review' && b.outcome !== 'under_review') {
          return -1;
        } else if (a.outcome !== 'under_review' && b.outcome === 'under_review') {
          return 1;
        } else if (a.outcome === 'under_review' && b.outcome === 'under_review') {
          // Both under review, sort by duration (shortest first)
          return calculateDurationDays(a) - calculateDurationDays(b);
        } else {
          // Both not under review, sort by end date (most recent first)
          const aEndDate = a.endDate ? new Date(a.endDate).getTime() : 0;
          const bEndDate = b.endDate ? new Date(b.endDate).getTime() : 0;
          return bEndDate - aEndDate;
        }
    }
  });
  
  // Helper function to calculate duration in days
  const calculateDurationDays = (merger: Merger): number => {
    const { startDate, endDate, outcome } = merger;
    
    if (endDate) {
      // For completed mergers, show the duration between filing and decision
      return differenceInBusinessDays(endDate, startDate);
    } else {
      // For under review mergers, show the duration since filing
      const today = new Date();
      return differenceInBusinessDays(today, startDate);
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
              Filing date: {
                dateFilter === 'last30days' ? 'Last 30 days' :
                dateFilter === 'last90days' ? 'Last 90 days' :
                dateFilter === 'last6months' ? 'Last 6 months' : 'Last year'
              }
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setDateFilter('all')}
              />
            </Badge>
          )}
          
          {(durationFilter.min || durationFilter.max) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Duration: {durationFilter.min ? `Min ${durationFilter.min} days` : ''} 
              {durationFilter.min && durationFilter.max ? ' - ' : ''}
              {durationFilter.max ? `Max ${durationFilter.max} days` : ''}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setDurationFilter({min: '', max: ''})}
              />
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear all
          </Button>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="relative">
              Target / Acquirer
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                    <Filter className="h-3.5 w-3.5" />
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
            <TableHead className="relative">
              Industry
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                    <Filter className="h-3.5 w-3.5" />
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
            <TableHead className="relative">
              Filing Date
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                    <Filter className="h-3.5 w-3.5" />
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
            <TableHead className="relative">
              Status
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                    <Filter className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {Object.entries(outcomeConfig).map(([key, config]) => (
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
            <TableHead className="relative">
              Duration
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2">
                    <Filter className="h-3.5 w-3.5" />
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
          {sortedMergers
            .slice(
              currentStartIndex,
              currentStartIndex + itemsPerPage
            )
            .map((merger) => (
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
                  <div className="space-y-1">
                    <div className="font-medium">{merger.target}</div>
                    <div className="text-sm text-muted-foreground">{merger.acquirer}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {merger.industry}
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
                  {calculateDuration(merger)}
                </TableCell>
                <TableCell className="text-right">
                  <FollowButton merger={merger} />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  {sortOptions.find(option => option.value === sortBy)?.label || 'Status (default)'}
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {sortOptions.map(option => (
                  <DropdownMenuItem 
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={cn(sortBy === option.value && "font-medium")}
                  >
                    <Check className={cn("mr-2 h-4 w-4", sortBy === option.value ? "opacity-100" : "opacity-0")} />
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
        <div className="text-sm text-muted-foreground">
            Showing {Math.min(1 + currentStartIndex, sortedMergers.length)} to{" "}
            {Math.min(currentStartIndex + itemsPerPage, sortedMergers.length)} of{" "}
            {sortedMergers.length} entries
          {showOnlyFollowed && " (Followed only)"}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {itemsPerPage} per page
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {[10, 25, 50, 100].map(pageSize => (
                <DropdownMenuItem 
                  key={pageSize}
                  onClick={() => {
                    setCurrentStartIndex(0); // Reset to first page when changing page size
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", itemsPerPage === pageSize ? "opacity-100" : "opacity-0")} />
                  {pageSize} per page
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStartIndex(Math.max(0, currentStartIndex - itemsPerPage))}
            disabled={currentStartIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentStartIndex(
                Math.min(
                    sortedMergers.length - 1,
                  currentStartIndex + itemsPerPage
                )
              )
            }
            disabled={
                currentStartIndex + itemsPerPage >= sortedMergers.length
            }
          >
            Next
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate the duration based on merger status
function calculateDuration(merger: Merger): string {
  const { startDate, endDate, outcome } = merger;
  
  if (endDate) {
    // For completed mergers, show the duration between filing and decision
    return `${differenceInBusinessDays(endDate, startDate)} business days`;
  } else {
    // For under review mergers, show the duration since filing
    const today = new Date();
    return `${differenceInBusinessDays(today, startDate)} business days`;
  }
} 