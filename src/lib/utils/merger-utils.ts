import { addBusinessDays } from "date-fns";
import { Merger, TimelineEvent } from "@/types/merger";
import { MergerStatusHistoryEntry } from "@/lib/supabase/mergerUtils";

// Generate timeline events for a merger
export const generateTimelineEvents = (
  merger: Merger, 
  statusHistory?: MergerStatusHistoryEntry[]
): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  const { startDate, endDate, outcome, hasPhase2 } = merger;
  const now = new Date();
  
  // Filing date (start date)
  events.push({
    id: `${merger.id}-filing`,
    name: 'Filing Date',
    title: 'Filing Date',
    date: new Date(startDate),
    type: 'filing',
    description: 'Initial merger notification filed with ACCC',
    completed: true,
    current: false
  });
  
  // If we have status history, use it to generate timeline events
  if (statusHistory && statusHistory.length > 0) {
    // Phase 1 start - directly after filing
    events.push({
      id: `${merger.id}-phase1Start`,
      name: 'Phase 1 Start',
      title: 'Phase 1 Start',
      date: new Date(startDate),
      type: 'phase1Start',
      description: 'Phase 1 review initiated',
      completed: true,
      current: false
    });
    
    // Process each status change
    statusHistory.forEach((entry, index) => {
      const entryDate = new Date(entry.created_at);
      const isLatestEntry = index === 0; // Status history is ordered by created_at DESC
      
      // Skip the first entry if it's the same as the filing date
      if (index === statusHistory.length - 1 && Math.abs(entryDate.getTime() - new Date(startDate).getTime()) < 86400000) {
        return;
      }
      
      // Handle Phase 2 start
      if (entry.has_phase_2 && (index === statusHistory.length - 1 || !statusHistory[index + 1].has_phase_2)) {
        // Add Phase 1 End first (this is the phase 1 determination date)
        const phase1EndDate = entryDate;
        events.push({
          id: `${merger.id}-phase1End`,
          name: 'Phase 1 Determination',
          title: 'Phase 1 Determination',
          date: phase1EndDate,
          type: 'phase1End',
          description: 'Phase 1 review completed with decision to proceed to Phase 2',
          completed: true,
          current: false
        });
        
        // Then add Phase 2 Start (same date as Phase 1 End)
        events.push({
          id: `${merger.id}-phase2Start`,
          name: 'Phase 2 Start',
          title: 'Phase 2 Start',
          date: phase1EndDate,
          type: 'phase2Start',
          description: 'Phase 2 in-depth investigation initiated',
          completed: true,
          current: isLatestEntry && entry.status === 'under_review'
        });
        
        // Add Notice of Competition Concerns (NOCC) event for Phase 2 mergers
        // It should be between Phase 2 start and final decision, closer to Phase 2 start
        const noccDate = new Date(phase1EndDate);
        noccDate.setDate(noccDate.getDate() + 15); // 15 days after Phase 2 starts
        
        // Only add if there's no explicit NOCC entry and the NOCC date is in the past or if there's a final decision
        const hasExplicitNocc = statusHistory.some(h => h.status === 'nocc_issued');
        const hasFinalDecision = statusHistory.some(h => 
          h.status === 'cleared' || h.status === 'blocked' || h.status === 'cleared_with_commitments'
        );
        
        if (!hasExplicitNocc && (noccDate <= now || hasFinalDecision)) {
          events.push({
            id: `${merger.id}-nocc`,
            name: 'Notice of Competition Concerns Issued',
            title: 'Notice of Competition Concerns Issued',
            date: noccDate,
            type: 'nocc',
            description: 'Notice of Competition Concerns (NOCC) issued, outlining potential competition issues',
            completed: true,
            current: false
          });
        }
      }
      
      // Handle status changes
      if (entry.status === 'cleared') {
        events.push({
          id: `${merger.id}-decision-${index}`,
          name: 'Final Decision',
          title: 'Final Decision',
          date: entryDate,
          type: 'decision',
          description: `Merger approved unconditionally${entry.has_phase_2 ? ' after Phase 2 investigation' : ' in Phase 1'}`,
          completed: true,
          current: isLatestEntry
        });
      } else if (entry.status === 'blocked') {
        // Ensure blocked status only appears for Phase 2 mergers
        if (entry.has_phase_2) {
          events.push({
            id: `${merger.id}-decision-${index}`,
            name: 'Final Decision',
            title: 'Final Decision',
            date: entryDate,
            type: 'decision',
            description: 'Merger rejected after Phase 2 investigation',
            completed: true,
            current: isLatestEntry
          });
        }
      } else if (entry.status === 'cleared_with_commitments') {
        // Add commitment event
        const commitmentDate = new Date(entryDate);
        commitmentDate.setDate(commitmentDate.getDate() - 10); // Assume commitments were offered 10 days before clearance
        
        events.push({
          id: `${merger.id}-commitment-${index}`,
          name: 'Remedies Offered',
          title: 'Remedies Offered',
          date: commitmentDate,
          type: 'commitment',
          description: 'Remedies proposed to address competition concerns',
          completed: true,
          current: false
        });
        
        // Add decision event
        events.push({
          id: `${merger.id}-decision-${index}`,
          name: 'Final Decision',
          title: 'Final Decision',
          date: entryDate,
          type: 'decision',
          description: `Merger approved with remedies${entry.has_phase_2 ? ' after Phase 2 investigation' : ' in Phase 1'}`,
          completed: true,
          current: isLatestEntry
        });
      } else if (entry.status === 'nocc_issued') {
        events.push({
          id: `${merger.id}-nocc-${index}`,
          name: 'Notice of Competition Concerns Issued',
          title: 'Notice of Competition Concerns Issued',
          date: entryDate,
          type: 'nocc',
          description: 'Notice of Competition Concerns (NOCC) issued, outlining potential competition issues',
          completed: true,
          current: isLatestEntry
        });
      }
    });
    
    // If merger is under review, add upcoming Phase 1 Determination event if not in Phase 2
    if (outcome === 'under_review' && !hasPhase2 && !events.some(e => e.type === 'phase1End')) {
      const phase1End = addBusinessDays(new Date(startDate), 30);
      const isPast = phase1End < now;
      
      events.push({
        id: `${merger.id}-phase1End`,
        name: 'Phase 1 Determination',
        title: 'Phase 1 Determination',
        date: phase1End,
        type: 'phase1End',
        description: 'Expected Phase 1 determination date',
        completed: isPast,
        current: !isPast,
        upcoming: !isPast
      });
    }
    
    // If merger is in Phase 2 and under review, add upcoming final decision event
    if (outcome === 'under_review' && hasPhase2 && !events.some(e => e.type === 'decision')) {
      // Find Phase 2 start date
      const phase2StartEvent = events.find(e => e.type === 'phase2Start');
      if (phase2StartEvent) {
        const phase2DecisionDate = addBusinessDays(new Date(phase2StartEvent.date), 90);
        const isPast = phase2DecisionDate < now;
        
        events.push({
          id: `${merger.id}-phase2Decision`,
          name: 'Expected Final Decision',
          title: 'Expected Final Decision',
          date: phase2DecisionDate,
          type: 'decision',
          description: 'Expected date for final decision',
          completed: false,
          current: false,
          upcoming: !isPast
        });
      }
    }
  } else {
    // If no status history, generate timeline based on merger data
    const phase1Start = new Date(startDate);
    
    // Add Phase 1 Start
    events.push({
      id: `${merger.id}-phase1Start`,
      name: 'Phase 1 Start',
      title: 'Phase 1 Start',
      date: phase1Start,
      type: 'phase1Start',
      description: 'Phase 1 review initiated',
      completed: true,
      current: false
    });
    
    // Determine if merger has been decided
    const isDecided = outcome !== 'under_review';
    const isBlocked = outcome === 'blocked';
    const isClearedWithCommitments = outcome === 'cleared_with_commitments';
    const hasPhase2Determined = hasPhase2 === true;
    
    // Phase 1 end (30 business days)
    const phase1Days = Math.floor(Math.random() * 10) + 25;
    const phase1End = addBusinessDays(phase1Start, phase1Days);
    const isPastPhase1 = phase1End < now;
    
    if (hasPhase2Determined) {
      // For Phase 2 mergers, add Phase 1 Determination
      events.push({
        id: `${merger.id}-phase1End`,
        name: 'Phase 1 Determination',
        title: 'Phase 1 Determination',
        date: phase1End,
        type: 'phase1End',
        description: 'Phase 1 review completed with decision to proceed to Phase 2',
        completed: isPastPhase1,
        current: !isPastPhase1 && !isDecided,
        upcoming: !isPastPhase1 && !isDecided
      });
      
      // Then add Phase 2 Start
      events.push({
        id: `${merger.id}-phase2Start`,
        name: 'Phase 2 Start',
        title: 'Phase 2 Start',
        date: phase1End,
        type: 'phase2Start',
        description: 'Phase 2 in-depth investigation initiated',
        completed: isPastPhase1,
        current: isPastPhase1 && !isDecided,
        upcoming: !isPastPhase1 && !isDecided
      });
      
      // Add NOCC event for Phase 2 mergers
      const noccDate = addBusinessDays(phase1End, 15);
      const isPastNocc = noccDate < now;
      
      events.push({
        id: `${merger.id}-nocc`,
        name: 'Notice of Competition Concerns Issued',
        title: 'Notice of Competition Concerns Issued',
        date: noccDate,
        type: 'nocc',
        description: 'Notice of Competition Concerns (NOCC) issued, outlining potential competition issues',
        completed: isPastNocc || isDecided,
        current: false,
        upcoming: !isPastNocc && !isDecided
      });
      
      // Final decision date
      const decisionDate = endDate || addBusinessDays(phase1End, 90);
      const isPastDecision = decisionDate < now;
      
      // Only add blocked outcome for Phase 2 mergers
      if (isBlocked) {
        events.push({
          id: `${merger.id}-decision`,
          name: 'Final Decision',
          title: 'Final Decision',
          date: decisionDate,
          type: 'decision',
          description: 'Merger rejected after Phase 2 investigation',
          completed: isDecided,
          current: isDecided,
          upcoming: !isDecided && !isPastDecision
        });
      } else if (isClearedWithCommitments) {
        // Add commitment event
        const commitmentDate = new Date(decisionDate);
        commitmentDate.setDate(commitmentDate.getDate() - 15);
        const isPastCommitment = commitmentDate < now;
        
        events.push({
          id: `${merger.id}-commitment`,
          name: 'Remedies Offered',
          title: 'Remedies Offered',
          date: commitmentDate,
          type: 'commitment',
          description: 'Remedies proposed to address competition concerns',
          completed: isDecided,
          current: false,
          upcoming: !isDecided && !isPastCommitment
        });
        
        events.push({
          id: `${merger.id}-decision`,
          name: 'Final Decision',
          title: 'Final Decision',
          date: decisionDate,
          type: 'decision',
          description: 'Merger approved with remedies after Phase 2 investigation',
          completed: isDecided,
          current: isDecided,
          upcoming: !isDecided && !isPastDecision
        });
      } else {
        events.push({
          id: `${merger.id}-decision`,
          name: 'Final Decision',
          title: 'Final Decision',
          date: decisionDate,
          type: 'decision',
          description: 'Merger approved unconditionally after Phase 2 investigation',
          completed: isDecided,
          current: isDecided,
          upcoming: !isDecided && !isPastDecision
        });
      }
    } else {
      // For Phase 1 only mergers, add Phase 1 Determination
      events.push({
        id: `${merger.id}-phase1End`,
        name: 'Phase 1 Determination',
        title: 'Phase 1 Determination',
        date: phase1End,
        type: 'phase1End',
        description: 'Expected Phase 1 determination date',
        completed: isPastPhase1 || isDecided,
        current: isPastPhase1 && !isDecided,
        upcoming: !isPastPhase1 && !isDecided
      });
      
      // Final decision for Phase 1 mergers
      if (isDecided) {
        const decisionDate = endDate || addBusinessDays(phase1End, 5);
        
        if (isClearedWithCommitments) {
          // Add commitment event
          const commitmentDate = new Date(decisionDate);
          commitmentDate.setDate(commitmentDate.getDate() - 5);
          
          events.push({
            id: `${merger.id}-commitment`,
            name: 'Remedies Offered',
            title: 'Remedies Offered',
            date: commitmentDate,
            type: 'commitment',
            description: 'Remedies proposed to address competition concerns',
            completed: true,
            current: false
          });
          
          events.push({
            id: `${merger.id}-decision`,
            name: 'Final Decision',
            title: 'Final Decision',
            date: decisionDate,
            type: 'decision',
            description: 'Merger approved with remedies in Phase 1',
            completed: true,
            current: true
          });
        } else {
          events.push({
            id: `${merger.id}-decision`,
            name: 'Final Decision',
            title: 'Final Decision',
            date: decisionDate,
            type: 'decision',
            description: 'Merger approved unconditionally in Phase 1',
            completed: true,
            current: true
          });
        }
      }
    }
  }
  
  // Sort events by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return events;
}; 