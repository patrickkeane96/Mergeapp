// Define outcome type
export type MergerOutcome = 'under_review' | 'cleared' | 'blocked' | 'cleared_with_commitments';

// Define the merger data type
export interface Merger {
  id: string;
  target: string;
  acquirer: string;
  name?: string; // Making this optional since we'll be using target/acquirer instead
  startDate: Date;
  endDate?: Date;
  industry: string;
  description?: string;
  outcome: MergerOutcome;
  // For future notification features
  hasNotifications?: boolean;
  isFollowed?: boolean;
  lastEvent?: string;
  // Track whether merger went through Phase 2
  hasPhase2?: boolean;
  timelineEvents?: TimelineEvent[];
}

// Define chart data type
export interface ChartDataItem {
  name: string;
  month: string;
  under_review: number;
  cleared: number;
  blocked: number;
  cleared_with_commitments: number;
  total: number;
}

// Define timeline event type
export interface TimelineEvent {
  id: string;
  name: string;
  title?: string; // For display in the timeline component
  date: Date;
  type: 'filing' | 'preAssessment' | 'phase1Start' | 'phase1End' | 'phase2Start' | 'phase2End' | 'commitment' | 'decision' | 'nocc';
  description: string;
  completed?: boolean; // Whether the event is completed
  current?: boolean; // Whether this is the current event
  upcoming?: boolean; // Whether this is an upcoming event
} 