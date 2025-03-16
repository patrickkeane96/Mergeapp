import { supabase } from './supabase';
import { Merger, MergerOutcome, TimelineEvent } from '@/types/merger';

// Type for the merger data in the database
export type MergerRecord = {
  id: string;
  name: string;
  acquirer: string;
  target: string;
  industry: string;
  filing_date: string;
  current_status: string;
  status_date: string;
  description?: string;
  is_followed?: boolean;
  has_phase_2?: boolean;
  created_at?: string;
  updated_at?: string;
};

// Type for merger status history entry
export type MergerStatusHistoryEntry = {
  id: string;
  merger_id: string;
  status: string;
  has_phase_2: boolean;
  created_at: string;
  updated_at?: string;
};

// Convert database record to application Merger type
export function convertToMerger(record: MergerRecord): Merger {
  // Map the database status to the application's outcome type
  const outcomeMap: Record<string, MergerOutcome> = {
    'Phase 1': 'under_review',
    'Phase 2': 'under_review',
    'Clock stopped': 'under_review',
    'Withdrawn': 'blocked',
    'Cleared': 'cleared',
    'Blocked': 'blocked',
    'Cleared (with commitments)': 'cleared_with_commitments'
  };

  return {
    id: record.id,
    target: record.target,
    acquirer: record.acquirer,
    name: `${record.target} / ${record.acquirer}`, // Generate name from target and acquirer
    startDate: new Date(record.filing_date),
    endDate: record.status_date && ['Cleared', 'Blocked', 'Cleared (with commitments)', 'Withdrawn'].includes(record.current_status) 
      ? new Date(record.status_date) 
      : null,
    industry: record.industry,
    description: record.description || '',
    outcome: outcomeMap[record.current_status] || 'under_review',
    isFollowed: record.is_followed || false,
    lastEvent: record.current_status,
    hasPhase2: record.has_phase_2 || record.current_status === 'Phase 2' || false
  };
}

// Convert application Merger type to database record
export function convertToMergerRecord(merger: Partial<Merger>): Partial<MergerRecord> {
  // Map the application's outcome type to database status
  const statusMap: Record<MergerOutcome, string> = {
    'under_review': 'Phase 1',
    'cleared': 'Cleared',
    'blocked': 'Blocked',
    'cleared_with_commitments': 'Cleared (with commitments)'
  };

  const record: Partial<MergerRecord> = {
    target: merger.target,
    acquirer: merger.acquirer,
    industry: merger.industry,
    is_followed: merger.isFollowed,
    has_phase_2: merger.hasPhase2
  };

  if (merger.startDate) {
    record.filing_date = merger.startDate.toISOString();
  }

  if (merger.outcome) {
    record.current_status = statusMap[merger.outcome];
    // If the merger is in Phase 2, update the status accordingly
    if (merger.hasPhase2 && merger.outcome === 'under_review') {
      record.current_status = 'Phase 2';
    }
  }

  if (merger.endDate) {
    record.status_date = merger.endDate.toISOString();
  }

  return record;
}

// Fetch all mergers
export async function fetchMergers(): Promise<Merger[]> {
  const { data, error } = await supabase
    .from('mergers')
    .select('*')
    .order('filing_date', { ascending: false });

  if (error) {
    console.error('Error fetching mergers:', error);
    return [];
  }

  return (data as MergerRecord[]).map(convertToMerger);
}

// Fetch a single merger by ID
export async function fetchMergerById(id: string): Promise<Merger | null> {
  const { data, error } = await supabase
    .from('mergers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching merger with ID ${id}:`, error);
    return null;
  }

  return convertToMerger(data as MergerRecord);
}

// Create a new merger
export async function createMerger(merger: Partial<Merger>): Promise<Merger | null> {
  const record = convertToMergerRecord(merger);
  
  const { data, error } = await supabase
    .from('mergers')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('Error creating merger:', error);
    return null;
  }

  return convertToMerger(data as MergerRecord);
}

// Update an existing merger
export async function updateMerger(id: string, merger: Partial<Merger>): Promise<Merger | null> {
  const record = convertToMergerRecord(merger);
  
  const { data, error } = await supabase
    .from('mergers')
    .update(record)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating merger with ID ${id}:`, error);
    return null;
  }

  return convertToMerger(data as MergerRecord);
}

// Delete a merger
export async function deleteMerger(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('mergers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting merger with ID ${id}:`, error);
    return false;
  }

  return true;
}

// Toggle follow status for a merger
export async function toggleFollowMerger(id: string, isFollowed: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('mergers')
    .update({ is_followed: isFollowed })
    .eq('id', id);

  if (error) {
    console.error(`Error updating follow status for merger with ID ${id}:`, error);
    return false;
  }

  return true;
}

// Fetch mergers by industry
export async function fetchMergersByIndustry(industry: string): Promise<Merger[]> {
  const { data, error } = await supabase
    .from('mergers')
    .select('*')
    .eq('industry', industry)
    .order('filing_date', { ascending: false });

  if (error) {
    console.error(`Error fetching mergers for industry ${industry}:`, error);
    return [];
  }

  return (data as MergerRecord[]).map(convertToMerger);
}

// Fetch followed mergers
export async function fetchFollowedMergers(): Promise<Merger[]> {
  const { data, error } = await supabase
    .from('mergers')
    .select('*')
    .eq('is_followed', true)
    .order('filing_date', { ascending: false });

  if (error) {
    console.error('Error fetching followed mergers:', error);
    return [];
  }

  return (data as MergerRecord[]).map(convertToMerger);
}

// Fetch merger status history
export const fetchMergerStatusHistory = async (mergerId: string): Promise<MergerStatusHistoryEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('merger_status_history')
      .select('*')
      .eq('merger_id', mergerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching merger status history:', error);
      return [];
    }
    
    return data as MergerStatusHistoryEntry[];
  } catch (error) {
    console.error('Error fetching merger status history:', error);
    return [];
  }
}; 