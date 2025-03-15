"use client";

import React from 'react';
import { format, differenceInBusinessDays } from "date-fns";
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FollowButton } from '@/components/ui/follow-button';
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

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Filing Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mergers
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
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <FollowButton merger={merger} />
                </TableCell>
                <TableCell className="font-medium">{merger.name}</TableCell>
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
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min(1 + currentStartIndex, mergers.length)} to{" "}
          {Math.min(currentStartIndex + itemsPerPage, mergers.length)} of{" "}
          {mergers.length} entries
          {showOnlyFollowed && " (Followed only)"}
        </div>
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
                  mergers.length - 1,
                  currentStartIndex + itemsPerPage
                )
              )
            }
            disabled={
              currentStartIndex + itemsPerPage >= mergers.length
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 