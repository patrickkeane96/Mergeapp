import { useState, useEffect, useCallback } from 'react';
import { Merger } from '@/types/merger';

export function useMergers() {
  const [mergers, setMergers] = useState<Merger[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all mergers
  const fetchMergers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/mergers');
      
      if (!response.ok) {
        throw new Error(`Error fetching mergers: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert date strings to Date objects
      const processedData = data.map((merger: any) => ({
        ...merger,
        startDate: new Date(merger.startDate),
        endDate: merger.endDate ? new Date(merger.endDate) : null
      }));
      
      setMergers(processedData);
    } catch (err) {
      console.error('Error fetching mergers:', err);
      setError('Failed to fetch mergers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single merger by ID
  const fetchMergerById = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/mergers/${id}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching merger: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert date strings to Date objects
      return {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null
      };
    } catch (err) {
      console.error(`Error fetching merger with ID ${id}:`, err);
      throw err;
    }
  }, []);

  // Create a new merger
  const createMerger = useCallback(async (mergerData: Partial<Merger>) => {
    try {
      const response = await fetch('/api/mergers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mergerData)
      });
      
      if (!response.ok) {
        throw new Error(`Error creating merger: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert date strings to Date objects
      const processedData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null
      };
      
      // Update the local state
      setMergers(prevMergers => [...prevMergers, processedData]);
      
      return processedData;
    } catch (err) {
      console.error('Error creating merger:', err);
      throw err;
    }
  }, []);

  // Update an existing merger
  const updateMerger = useCallback(async (id: string, mergerData: Partial<Merger>) => {
    try {
      const response = await fetch(`/api/mergers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mergerData)
      });
      
      if (!response.ok) {
        throw new Error(`Error updating merger: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert date strings to Date objects
      const processedData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null
      };
      
      // Update the local state
      setMergers(prevMergers => 
        prevMergers.map(merger => 
          merger.id === id ? processedData : merger
        )
      );
      
      return processedData;
    } catch (err) {
      console.error(`Error updating merger with ID ${id}:`, err);
      throw err;
    }
  }, []);

  // Delete a merger
  const deleteMerger = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/mergers/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting merger: ${response.status}`);
      }
      
      // Update the local state
      setMergers(prevMergers => 
        prevMergers.filter(merger => merger.id !== id)
      );
      
      return true;
    } catch (err) {
      console.error(`Error deleting merger with ID ${id}:`, err);
      throw err;
    }
  }, []);

  // Toggle follow status
  const toggleFollowMerger = useCallback(async (id: string, isFollowed: boolean) => {
    try {
      const response = await fetch(`/api/mergers/${id}/follow`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFollowed })
      });
      
      if (!response.ok) {
        throw new Error(`Error updating follow status: ${response.status}`);
      }
      
      // Update the local state
      setMergers(prevMergers => 
        prevMergers.map(merger => 
          merger.id === id ? { ...merger, isFollowed } : merger
        )
      );
      
      return true;
    } catch (err) {
      console.error(`Error updating follow status for merger with ID ${id}:`, err);
      throw err;
    }
  }, []);

  // Fetch followed mergers
  const fetchFollowedMergers = useCallback(async () => {
    try {
      const response = await fetch('/api/mergers/followed');
      
      if (!response.ok) {
        throw new Error(`Error fetching followed mergers: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert date strings to Date objects
      return data.map((merger: any) => ({
        ...merger,
        startDate: new Date(merger.startDate),
        endDate: merger.endDate ? new Date(merger.endDate) : null
      }));
    } catch (err) {
      console.error('Error fetching followed mergers:', err);
      throw err;
    }
  }, []);

  // Fetch mergers by industry
  const fetchMergersByIndustry = useCallback(async (industry: string) => {
    try {
      const response = await fetch(`/api/mergers/industry/${encodeURIComponent(industry)}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching mergers by industry: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert date strings to Date objects
      return data.map((merger: any) => ({
        ...merger,
        startDate: new Date(merger.startDate),
        endDate: merger.endDate ? new Date(merger.endDate) : null
      }));
    } catch (err) {
      console.error(`Error fetching mergers for industry ${industry}:`, err);
      throw err;
    }
  }, []);

  // Load mergers on component mount
  useEffect(() => {
    fetchMergers();
  }, [fetchMergers]);

  return {
    mergers,
    loading,
    error,
    fetchMergers,
    fetchMergerById,
    createMerger,
    updateMerger,
    deleteMerger,
    toggleFollowMerger,
    fetchFollowedMergers,
    fetchMergersByIndustry
  };
} 