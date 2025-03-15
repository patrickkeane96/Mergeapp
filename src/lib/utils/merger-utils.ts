import { addBusinessDays } from "date-fns";
import { Merger, TimelineEvent } from "@/types/merger";

// Generate timeline events for a merger
export const generateTimelineEvents = (merger: Merger): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  const { startDate, endDate, outcome } = merger;
  
  // Filing date (start date)
  events.push({
    id: `${merger.id}-filing`,
    name: 'Filing Date',
    date: new Date(startDate),
    type: 'filing',
    description: 'Initial merger notification filed with ACCC'
  });
  
  // Pre-assessment period (5-15 business days)
  const preAssessmentDays = Math.floor(Math.random() * 10) + 5;
  const preAssessmentEnd = addBusinessDays(startDate, preAssessmentDays);
  events.push({
    id: `${merger.id}-preAssessment`,
    name: 'Pre-assessment Complete',
    date: preAssessmentEnd,
    type: 'preAssessment',
    description: `Pre-assessment completed in ${preAssessmentDays} business days`
  });
  
  // Phase 1 start
  const phase1Start = new Date(preAssessmentEnd);
  events.push({
    id: `${merger.id}-phase1Start`,
    name: 'Phase 1 Start',
    date: phase1Start,
    type: 'phase1Start',
    description: 'Phase 1 review initiated'
  });
  
  // Phase 1 end (30-45 business days)
  const phase1Days = Math.floor(Math.random() * 15) + 30;
  const phase1End = addBusinessDays(phase1Start, phase1Days);
  events.push({
    id: `${merger.id}-phase1End`,
    name: 'Phase 1 End',
    date: phase1End,
    type: 'phase1End',
    description: `Phase 1 review completed in ${phase1Days} business days`
  });
  
  // Determine whether to have a Phase 2 based on the outcome and random chance
  const isBlocked = outcome === 'blocked';
  const isClearedWithCommitments = outcome === 'cleared_with_commitments';
  const hasPhase2 = isBlocked || isClearedWithCommitments || Math.random() > 0.7;
  
  if (hasPhase2) {
    // Phase 2 start
    const phase2Start = new Date(phase1End);
    events.push({
      id: `${merger.id}-phase2Start`,
      name: 'Phase 2 Start',
      date: phase2Start,
      type: 'phase2Start',
      description: 'Phase 2 in-depth investigation initiated'
    });
    
    // Phase 2 end (90-120 business days)
    const phase2Days = Math.floor(Math.random() * 30) + 90;
    const phase2End = addBusinessDays(phase2Start, phase2Days);
    events.push({
      id: `${merger.id}-phase2End`,
      name: 'Phase 2 End',
      date: phase2End,
      type: 'phase2End',
      description: `Phase 2 investigation completed in ${phase2Days} business days`
    });
    
    // Commitments (if relevant)
    if (isClearedWithCommitments) {
      // Commitments offered during Phase 2
      const commitmentDate = new Date(phase2Start);
      commitmentDate.setDate(commitmentDate.getDate() + Math.floor(Math.random() * phase2Days));
      events.push({
        id: `${merger.id}-commitment`,
        name: 'Commitments Offered',
        date: commitmentDate,
        type: 'commitment',
        description: 'Remedies proposed to address competition concerns'
      });
    }
    
    // Final decision
    const decisionDate = endDate || addBusinessDays(phase2End, Math.floor(Math.random() * 10) + 5);
    
    let decisionDescription = '';
    if (isBlocked) {
      decisionDescription = 'Merger rejected';
    } else if (isClearedWithCommitments) {
      decisionDescription = 'Merger approved with conditions';
    } else {
      decisionDescription = 'Merger approved unconditionally';
    }
    
    events.push({
      id: `${merger.id}-decision`,
      name: 'Final Decision',
      date: decisionDate,
      type: 'decision',
      description: decisionDescription
    });
  } else {
    // Commitments in Phase 1 (if relevant)
    if (isClearedWithCommitments) {
      // Commitments offered during Phase 1
      const commitmentDate = new Date(phase1Start);
      commitmentDate.setDate(commitmentDate.getDate() + Math.floor(Math.random() * phase1Days));
      events.push({
        id: `${merger.id}-commitment`,
        name: 'Commitments Offered',
        date: commitmentDate,
        type: 'commitment',
        description: 'Remedies proposed to address competition concerns'
      });
    }
    
    // Final decision without Phase 2
    const decisionDate = endDate || addBusinessDays(phase1End, Math.floor(Math.random() * 10) + 5);
    
    const decisionDescription = isClearedWithCommitments 
      ? 'Merger approved with conditions in Phase 1'
      : 'Merger approved unconditionally in Phase 1';
    
    events.push({
      id: `${merger.id}-decision`,
      name: 'Final Decision',
      date: decisionDate,
      type: 'decision',
      description: decisionDescription
    });
  }
  
  // Sort events by date
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}; 