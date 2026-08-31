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

/** docs/RoutineMate-MVP2-Scope.md §3.3 "Mood-vs-completion correlation
 * shown as a simple chart on the Stats page". One point per mood value
 * (1-5) that has at least one journal entry in the window. */
export interface MoodCorrelationPoint {
  mood: number;
  avgCompletionPercentage: number;
  entryCount: number;
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
  moodCorrelation: MoodCorrelationPoint[];
  /** e.g. "You complete 20% more habits on days you log a positive mood."
   * Null when there isn't yet a low-mood and a high-mood day to compare. */
  moodInsight: string | null;
}

export type StatsStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface StatsState {
  summary: StatsSummary | null;
  status: StatsStatus;
  error: string | null;
}
