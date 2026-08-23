export interface WeeklyCompletionPoint {
  day: string;
  percentage: number;
}

export interface CategoryBreakdownPoint {
  category: string;
  count: number;
}

export interface TimeOfDayPoint {
  label: string;
  percentage: number;
}

export interface StatsSummary {
  totalCheckIns: number;
  completionRate: number;
  bestStreak: number;
  activeRoutines: number;
  weekly: WeeklyCompletionPoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
  trend30Day: number[];
  timeOfDay: TimeOfDayPoint[];
}

export type StatsStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface StatsState {
  summary: StatsSummary | null;
  status: StatsStatus;
  error: string | null;
}
