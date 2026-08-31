export type GoalStatus = 'active' | 'completed';

/** A manual checkpoint for goals that aren't purely check-in based — see
 * docs/RoutineMate-MVP2-Scope.md §3.2 "manual milestone checkpoints". `id`
 * is always server-assigned (backend/src/services/goals.service.ts). */
export interface GoalMilestone {
  id: string;
  title: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  emoji: string;
  targetDate: string; // 'YYYY-MM-DD'
  status: GoalStatus;
  /** 0-100. Computed server-side (backend/src/services/goals.service.ts) —
   * from milestones when the goal has any, otherwise from the linked
   * routines' live streaks vs. the goal's time window. See
   * docs/RoutineMate-MVP2-Scope.md §3.2. Never set by the client. */
  progress: number;
  linkedRoutineIds: string[];
  milestones: GoalMilestone[];
  completedAt: string | null;
  createdAt: string;
}

export interface CreateGoalInput {
  title: string;
  targetDate: string;
  linkedRoutineIds: string[];
  /** Client only supplies titles — ids/done are assigned server-side. */
  milestones: { title: string }[];
}

export type GoalsStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface GoalsState {
  items: Goal[];
  status: GoalsStatus;
  error: string | null;
}
