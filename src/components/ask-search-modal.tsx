"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from 'ai/react';
import { Merger } from '@/types/merger';
import { useNotifications } from '@/lib/contexts/NotificationsContext';
import {
  CustomDialog,
  CustomDialogContent,
  CustomDialogHeader,
  CustomDialogTitle,
  CustomDialogFooter,
  CustomDialogDescription
} from '@/components/ui/custom-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, SearchIcon, AlertCircle, Sparkles } from 'lucide-react';
import { addDays, format, subDays, differenceInDays } from 'date-fns';
import { EnhancedMergerTable } from '@/components/enhanced-merger-table';
import { MergerDetailsModal } from '@/components/merger-details-modal';
import { generateTimelineEvents } from "@/lib/utils/merger-utils";
import { TimelineEvent } from '@/types/merger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AskSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  allMergers: Merger[];
};

// Basic filtering without AI for fallback
const basicFiltering = (query: string, mergers: Merger[]): Merger[] => {
  const lowerQuery = query.toLowerCase();
  return mergers.filter(merger => 
    merger.target.toLowerCase().includes(lowerQuery) ||
    merger.acquirer.toLowerCase().includes(lowerQuery) ||
    merger.industry.toLowerCase().includes(lowerQuery) ||
    merger.description?.toLowerCase().includes(lowerQuery) ||
    merger.outcome.toLowerCase().includes(lowerQuery)
  );
};

export function AskSearchModal({ isOpen, onClose, allMergers }: AskSearchModalProps) {
  // State definitions
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredMergers, setFilteredMergers] = useState<Merger[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedMerger, setSelectedMerger] = useState<Merger | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [searchMode, setSearchMode] = useState<'basic' | 'ai'>('basic');
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  
  // System prompt for the AI
  const systemPrompt = `
    You are a helpful assistant that parses natural language search queries about mergers and converts them to structured filter parameters.
    The user will provide a natural language query, and you should respond with a JSON object containing filter parameters.
    Your response MUST be valid JSON and nothing else.
    
    Available filters:
    - industry: string[] - List of industries to include
    - outcome: string[] - List of outcomes to include (under_review, cleared, blocked, cleared_with_commitments)
    - dateRange: { from?: string, to?: string } - Date range for merger start dates
    - recentActivity: number - Activity within the last X days
    - keywords: string[] - Keywords to search for in merger name, description, or industry
    
    Also include a brief "explanation" field summarizing how you interpreted the query.
    
    Example: "Show me healthcare mergers in the last 30 days"
    Response: {
      "industry": ["Healthcare"],
      "recentActivity": 30,
      "explanation": "Searching for mergers in the Healthcare industry with activity in the last 30 days"
    }
  `;
  
  // Setup AI chat
  const { 
    handleSubmit, 
    messages, 
    input, 
    setInput, 
    isLoading: isAiLoading, 
    setMessages, 
    stop 
  } = useChat({
    api: '/api/openai/chat',
    initialMessages: [
      {
        id: 'system-1',
        role: 'system',
        content: systemPrompt,
      }
    ],
    onResponse: (response) => {
      // Clear timeout when any response is received
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      
      console.log("Received response from AI");
    },
    onFinish: (message) => {
      try {
        console.log("Processing AI response:", message.content);
        
        // Clear timeout if it's still active
        if (timeoutId) {
          clearTimeout(timeoutId);
          setTimeoutId(null);
        }
        
        // If we timed out, we'll use basic filtering instead
        if (hasTimedOut) {
          setHasTimedOut(false);
          handleBasicSearch();
          return;
        }
        
        // Process the AI response
        let cleanedContent = message.content.trim();
        
        // Try to extract JSON if it's wrapped in markdown code blocks
        const jsonRegex = /```(?:json)?([\s\S]*?)```/;
        const match = cleanedContent.match(jsonRegex);
        if (match && match[1]) {
          cleanedContent = match[1].trim();
        }
        
        // Parse the AI response to extract filter parameters
        const response = JSON.parse(cleanedContent);
        
        // Apply filters to mergers
        const results = applyFilters(response);
        setFilteredMergers(results);
        setExplanation(response.explanation || '');
        setIsSearching(false);
        setError(null);
        setSearchAttempted(true);
      } catch (error) {
        console.error('Failed to parse AI response:', error, message.content);
        
        // If we can't parse the JSON, fall back to basic text filtering
        handleBasicSearch();
        
        // Still show the error for debugging
        setError(`AI couldn't understand the query. Using basic search instead.`);
      }
    },
    onError: (error) => {
      console.error("AI Chat error:", error);
      
      // Clear timeout if it's still active
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      
      // Fall back to basic filtering
      handleBasicSearch();
      
      setError(`Error connecting to AI service. Using basic search instead.`);
    }
  });

  // Apply filters from AI response to the merger data
  const applyFilters = (filters: any) => {
    return allMergers.filter(merger => {
      // Industry filter
      if (filters.industry && filters.industry.length > 0) {
        const industryMatched = filters.industry.some((industry: string) => 
          merger.industry.toLowerCase().includes(industry.toLowerCase())
        );
        if (!industryMatched) {
          return false;
        }
      }

      // Outcome filter
      if (filters.outcome && filters.outcome.length > 0) {
        const outcomeMatched = filters.outcome.some((outcome: string) => 
          merger.outcome.toLowerCase().includes(outcome.toLowerCase())
        );
        if (!outcomeMatched) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const mergerDate = merger.startDate;
        if (filters.dateRange.from) {
          const fromDate = new Date(filters.dateRange.from);
          if (mergerDate < fromDate) {
            return false;
          }
        }
        if (filters.dateRange.to) {
          const toDate = new Date(filters.dateRange.to);
          if (mergerDate > toDate) {
            return false;
          }
        }
      }

      // Recent activity filter (last X days)
      if (filters.recentActivity) {
        const today = new Date();
        const daysAgo = subDays(today, filters.recentActivity);
        if (merger.startDate < daysAgo && (!merger.endDate || merger.endDate < daysAgo)) {
          return false;
        }
      }

      // Keyword search
      if (filters.keywords && filters.keywords.length > 0) {
        const mergerText = `${merger.target} ${merger.acquirer} ${merger.description} ${merger.industry}`.toLowerCase();
        const hasKeyword = filters.keywords.some((keyword: string) => 
          mergerText.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) {
          return false;
        }
      }

      return true;
    });
  };
  
  // Debug when modal state changes
  useEffect(() => {
    console.log("Modal open state changed:", isOpen);
    if (isOpen) {
      setIsClosing(false);
      // Small delay to ensure the modal is visible before showing content
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);
  
  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setShowContent(false);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };
  
  // Focus the input field when the modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      console.log("Focusing input field");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Debounced search function for basic search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      return (query: string) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        if (!query.trim()) return;
        
        console.log("Setting up debounced search for:", query);
        timeoutId = setTimeout(() => {
          console.log("Executing debounced search for:", query);
          setIsSearching(true);
          setSearchAttempted(true);
          
          // Run the search
          const results = basicFiltering(query, allMergers);
          setFilteredMergers(results);
          setExplanation(`Found ${results.length} results matching "${query}"`);
          setIsSearching(false);
          
          timeoutId = null;
        }, 500); // 500ms debounce time
      };
    })(),
    [allMergers]
  );

  // Handle basic search
  const handleBasicSearch = () => {
    if (!searchQuery.trim()) return;
    
    console.log("Starting basic search for:", searchQuery);
    setIsSearching(true);
    setSearchAttempted(true);
    
    // Use basic search
    const results = basicFiltering(searchQuery, allMergers);
    setFilteredMergers(results);
    setExplanation(`Found ${results.length} results matching "${searchQuery}"`);
    setIsSearching(false);
  };

  // Handle AI search
  const handleAiSearch = () => {
    if (!searchQuery.trim()) return;
    
    console.log("Starting AI search for:", searchQuery);
    setIsSearching(true);
    setFilteredMergers([]);
    setExplanation('');
    setError(null);
    setSearchAttempted(true);
    setHasTimedOut(false);
    
    // Set a timeout to fallback to basic search if AI takes too long
    const timeout = setTimeout(() => {
      console.log("Search timed out, falling back to basic search");
      setHasTimedOut(true);
      setError("The AI service took too long to respond. Using basic search instead.");
      
      // Stop the AI request
      stop();
      
      // Perform basic search
      handleBasicSearch();
    }, 10000); // 10 second timeout
    
    setTimeoutId(timeout);
    
    // Set input and submit to AI
    setInput(searchQuery);
    handleSubmit(new Event('submit') as any);
  };

  // Handle search based on current mode
  const handleSearch = () => {
    if (searchMode === 'ai') {
      handleAiSearch();
    } else {
      handleBasicSearch();
    }
  };

  // Trigger debounced search when search query changes (only in basic mode)
  useEffect(() => {
    if (searchMode === 'basic' && searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else if (!searchQuery.trim()) {
      setFilteredMergers([]);
      setExplanation('');
    }
  }, [searchQuery, debouncedSearch, searchMode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSearching && !isAiLoading) {
      handleSearch();
    }
  };

  const handleRowClick = (merger: Merger) => {
    setSelectedMerger(merger);
    setTimelineEvents(generateTimelineEvents(merger));
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedMerger(null);
    setTimelineEvents([]);
  };

  // Reset search when modal is opened or closed
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSearchQuery('');
      setFilteredMergers([]);
      setExplanation('');
      setError(null);
      setSearchAttempted(false);
      
      // Stop any ongoing AI request
      if (isAiLoading) {
        stop();
      }
      
      // Clear any active timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      
      // Reset the AI chat
      setMessages([
        {
          id: 'system-1',
          role: 'system',
          content: systemPrompt,
        }
      ]);
    }
  }, [isOpen, setMessages, systemPrompt, stop, isAiLoading]);

  // Reset search attempted state when query changes in basic mode
  useEffect(() => {
    if (searchMode === 'basic' && searchAttempted) {
      setSearchAttempted(false);
    }
  }, [searchQuery, searchMode]);

  // Check if OpenAI API is configured
  useEffect(() => {
    const checkAiAvailability = async () => {
      try {
        const response = await fetch('/api/openai/check');
        const data = await response.json();
        setAiAvailable(data.available);
        
        // If AI is not available, set to basic mode
        if (!data.available && searchMode === 'ai') {
          setSearchMode('basic');
          setError('AI search is not available: OpenAI API key not configured. Using basic search instead.');
        }
      } catch (err) {
        console.error('Failed to check AI availability:', err);
        setAiAvailable(false);
        if (searchMode === 'ai') {
          setSearchMode('basic');
        }
      }
    };
    
    if (isOpen && aiAvailable === null) {
      checkAiAvailability();
    }
  }, [isOpen, searchMode, aiAvailable]);
  
  // When switching to AI mode, verify it's available
  useEffect(() => {
    if (searchMode === 'ai' && aiAvailable === false) {
      setSearchMode('basic');
      setError('AI search is not available: OpenAI API key not configured. Using basic search instead.');
    }
  }, [searchMode, aiAvailable]);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  useEffect(() => {
    if (!isOpen) {
      setSearchAttempted(false);
    }
  }, [isOpen, searchAttempted]);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  }, [handleSearch]);

  return (
    <>
      <CustomDialog open={isOpen || isClosing} onOpenChange={(open) => !open && handleClose()}>
        <CustomDialogContent 
          className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0"
          showContent={showContent}
          onCloseClick={handleClose}
          onEscapeKeyDown={(e) => e.preventDefault()}
          forceMount
        >
          <CustomDialogHeader className="flex-shrink-0 p-6 pb-3">
            <CustomDialogTitle className="text-xl">Search Mergers</CustomDialogTitle>
          </CustomDialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <Tabs 
                defaultValue="basic" 
                className="w-full" 
                onValueChange={(value) => {
                  if (value === 'ai' && aiAvailable === false) {
                    setError('AI search is not available: OpenAI API key not configured.');
                    return;
                  }
                  setSearchMode(value as 'basic' | 'ai');
                }}
                value={searchMode}
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="basic">Basic Search</TabsTrigger>
                  <TabsTrigger 
                    value="ai" 
                    className="flex items-center gap-1"
                    disabled={aiAvailable === false}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Search</span>
                    {aiAvailable === false && <span className="text-xs ml-1">(Unavailable)</span>}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="mt-0">
                  <div className="flex items-center gap-2 my-4">
                    <Input
                      ref={inputRef}
                      placeholder="Search mergers by keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1"
                      disabled={isSearching}
                    />
                    <Button 
                      onClick={handleBasicSearch} 
                      disabled={isSearching || !searchQuery.trim()}
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <SearchIcon className="h-4 w-4 mr-2" />
                      )}
                      Search
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="ai" className="mt-0">
                  <div className="flex items-center gap-2 my-4">
                    <Input
                      ref={inputRef}
                      placeholder="E.g., Healthcare mergers in the last 30 days that were cleared"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1"
                      disabled={isSearching || isAiLoading}
                    />
                    <Button 
                      onClick={handleAiSearch}
                      disabled={isSearching || isAiLoading || !searchQuery.trim()}
                    >
                      {isSearching || isAiLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Ask
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Try queries like "Blocked technology mergers" or "Media mergers from 2023 that were cleared with commitments"
                  </p>
                </TabsContent>
              </Tabs>
              
              {explanation && (
                <div className="text-sm bg-muted p-3 rounded-md mb-4">
                  {explanation}
                </div>
              )}

              {error && (
                <div className="text-sm bg-red-100 text-red-800 p-3 rounded-md mb-4 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}
              
              <Separator className="my-2" />
              
              <ScrollArea className="flex-1 max-h-[400px]">
                {filteredMergers.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {filteredMergers.length} merger{filteredMergers.length !== 1 ? 's' : ''} found
                    </p>
                    <EnhancedMergerTable
                      mergers={filteredMergers}
                      highlightedMergerId={null}
                      onRowClick={handleRowClick}
                      currentStartIndex={0}
                      itemsPerPage={10}
                      setCurrentStartIndex={() => {}}
                      openMergerDetails={handleRowClick}
                    />
                  </div>
                ) : isSearching || isAiLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-center text-muted-foreground">
                      {searchMode === 'ai' ? 'Processing your question...' : 'Searching for mergers...'}
                    </p>
                    {searchMode === 'ai' && (
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        (If this takes too long, we'll automatically use basic search)
                      </p>
                    )}
                  </div>
                ) : searchAttempted && searchQuery ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-center text-muted-foreground">No results found</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <SearchIcon className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-4 text-center text-muted-foreground">
                      {searchMode === 'ai' 
                        ? 'Ask a natural language question about mergers' 
                        : 'Enter search terms to find matching mergers'}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </form>
          </div>
          
          <CustomDialogFooter className="mt-4">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </CustomDialogFooter>
        </CustomDialogContent>
      </CustomDialog>

      {/* Merger Details Modal */}
      {selectedMerger && (
        <MergerDetailsModal
          merger={selectedMerger}
          timelineEvents={timelineEvents}
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
        />
      )}
    </>
  );
} 