// Define outcome type
export type MergerOutcome = 'under_review' | 'cleared' | 'blocked' | 'cleared_with_commitments';

// Define the merger data type
export type Merger = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  industry: string;
  description?: string;
  outcome: MergerOutcome;
  // For future notification features
  hasNotifications?: boolean;
  isFollowed?: boolean;
  lastEvent?: string;
};

// Define chart data type
export type ChartDataItem = {
  name: string;
  month: string;
  under_review: number;
  cleared: number;
  blocked: number;
  cleared_with_commitments: number;
  total: number;
};

// Define timeline event type
export type TimelineEvent = {
  id: string;
  name: string;
  date: Date;
  type: 'filing' | 'preAssessment' | 'phase1Start' | 'phase1End' | 'phase2Start' | 'phase2End' | 'commitment' | 'decision' | 'nocc';
  description: string;
}; 