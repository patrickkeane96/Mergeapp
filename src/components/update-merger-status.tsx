"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Merger, MergerOutcome } from '@/types/merger';
import { useNotifications } from '@/lib/contexts/NotificationsContext';
import { Edit } from 'lucide-react';

interface UpdateMergerStatusProps {
  merger: Merger;
  onStatusUpdated: () => void;
}

export function UpdateMergerStatus({ merger, onStatusUpdated }: UpdateMergerStatusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<MergerOutcome>(merger.outcome);
  const [hasPhase2, setHasPhase2] = useState<boolean>(merger.hasPhase2 || false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { addNotification } = useNotifications();

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    
    try {
      const response = await fetch(`/api/mergers/${merger.id}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          hasPhase2
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error updating merger status: ${response.status}`);
      }
      
      // Add notification about the status change
      addNotification({
        type: 'status_change',
        title: `Merger Status Updated: ${merger.name}`,
        message: `Status changed to ${status}${hasPhase2 ? ' (Phase 2)' : ' (Phase 1)'}`,
        mergerId: merger.id,
        industry: merger.industry,
        outcome: status
      });
      
      // Close the dialog and notify parent
      setIsOpen(false);
      onStatusUpdated();
    } catch (error) {
      console.error('Error updating merger status:', error);
      
      // Add error notification
      addNotification({
        type: 'status_change',
        title: 'Error',
        message: 'Failed to update merger status',
        mergerId: merger.id
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Update Status
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Merger Status</DialogTitle>
          <DialogDescription>
            Change the status of the merger. This will be recorded in the status history.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as MergerOutcome)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="cleared">Cleared</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="cleared_with_commitments">Cleared with Commitments</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phase2" className="text-right">
              Phase 2
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Checkbox
                id="phase2"
                checked={hasPhase2}
                onCheckedChange={(checked) => setHasPhase2(checked === true)}
              />
              <Label htmlFor="phase2" className="cursor-pointer">
                Merger is in Phase 2
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleUpdateStatus}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 