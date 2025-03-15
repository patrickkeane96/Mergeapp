"use client";

import React, { useState } from 'react';
import { format, differenceInBusinessDays } from "date-fns";
import { Bell, ChevronDown, Check, Star, X } from 'lucide-react';
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
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-800"
  }
};

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
  
  // State for filters
  const [nameFilter, setNameFilter] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | 'last30days' | 'last90days' | 'last6months' | 'lastyear'>('all');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Extract unique industries from mergers
  const industries = Array.from(new Set(mergers.map(merger => merger.industry)));
  
  // Filter mergers based on current filters
  const filteredMergers = mergers.filter(merger => {
    // Name filter
    const nameMatch = nameFilter === '' || 
      merger.name.toLowerCase().includes(nameFilter.toLowerCase());
    
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
    
    return nameMatch && industryMatch && statusMatch && dateMatch;
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
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        {/* Active filters display */}
        {(nameFilter || selectedIndustries.length > 0 || selectedStatuses.length > 0 || dateFilter !== 'all') && (
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
            
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear all
            </Button>
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 cursor-pointer">
                    Name
                    <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <div className="p-2">
                      <Input
                        placeholder="Filter by name..."
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="w-[15%]">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 cursor-pointer">
                    Industry
                    <ChevronDown className="h-4 w-4" />
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
                        className="flex items-center justify-between"
                      >
                        <span>{industry}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 ml-2"
                          onClick={(e) => handleIndustryFollow(industry, e)}
                        >
                          {isIndustryFollowed(industry) ? (
                            <Bell className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Bell className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="w-[15%]">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 cursor-pointer">
                    Filing Date
                    <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuCheckboxItem
                      checked={dateFilter === 'all'}
                      onCheckedChange={() => setDateFilter('all')}
                    >
                      All dates
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={dateFilter === 'last30days'}
                      onCheckedChange={() => setDateFilter('last30days')}
                    >
                      Last 30 days
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={dateFilter === 'last90days'}
                      onCheckedChange={() => setDateFilter('last90days')}
                    >
                      Last 90 days
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={dateFilter === 'last6months'}
                      onCheckedChange={() => setDateFilter('last6months')}
                    >
                      Last 6 months
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={dateFilter === 'lastyear'}
                      onCheckedChange={() => setDateFilter('lastyear')}
                    >
                      Last year
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="w-[15%]">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 cursor-pointer">
                    Status
                    <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {Object.entries(outcomeConfig).map(([key, value]) => (
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
                        {value.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="w-[15%]">Duration</TableHead>
              <TableHead className="w-[20%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMergers.slice(currentStartIndex, currentStartIndex + rowsPerPage).map((merger) => (
              <TableRow 
                key={merger.id}
                className={cn(
                  highlightedMergerId === merger.id && "bg-primary/5",
                  "transition-colors hover:bg-muted/50 cursor-pointer"
                )}
                onClick={() => onRowClick(merger)}
              >
                <TableCell className="font-medium">
                  <div className="truncate max-w-[300px]">{merger.name}</div>
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
                      "px-2 py-1",
                      outcomeConfig[merger.outcome].bgColor,
                      outcomeConfig[merger.outcome].textColor
                    )}
                  >
                    {outcomeConfig[merger.outcome].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {merger.endDate
                    ? `${differenceInBusinessDays(
                        merger.endDate,
                        merger.startDate
                      )} business days`
                    : "Ongoing"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <FollowButton merger={merger} />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(merger);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(filteredMergers.length, currentStartIndex + 1)} to {Math.min(filteredMergers.length, currentStartIndex + rowsPerPage)} of {filteredMergers.length} mergers
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
              onClick={() => setCurrentStartIndex(Math.min(filteredMergers.length - 1, currentStartIndex + rowsPerPage))}
              disabled={currentStartIndex + rowsPerPage >= filteredMergers.length}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 