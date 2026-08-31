export interface Achievement {
  id: string;
  icon: string;
  title: string;
  /** Shown for unlocked badges, e.g. "Unlocked Aug 18, 2026". */
  unlockedAt: string | null;
  /** Shown for locked badges, e.g. "18 more days to go". */
  progressLabel: string | null;
}

export interface UserXp {
  totalPoints: number;
  level: number;
  xpToNextLevel: number;
  /** 0-100, for the level progress bar. */
  levelProgressPercent: number;
}

export type AchievementsStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AchievementsState {
  items: Achievement[];
  xp: UserXp | null;
  status: AchievementsStatus;
  error: string | null;
}

/** Shared with the Dashboard's "Recent Achievement" widget so both places
 * show the badge's real unlock date instead of assuming "today". */
export function formatUnlockedDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
