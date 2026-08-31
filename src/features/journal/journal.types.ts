// MVP-2: Journal & Mood tracking — see docs/RoutineMate-MVP2-Scope.md §3.3.
// A short daily reflection paired with a 5-point mood scale, separate from
// habit check-ins. One entry per calendar day (creating a new entry for
// today replaces today's existing entry rather than duplicating it).

export interface MoodOption {
  value: 1 | 2 | 3 | 4 | 5;
  emoji: string;
  label: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '🙁', label: 'Not great' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

export function moodEmoji(mood: number): string {
  return MOOD_OPTIONS.find((m) => m.value === mood)?.emoji ?? '🙂';
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: 1 | 2 | 3 | 4 | 5;
  note: string;
  createdAt: string;
}

export interface CreateJournalEntryInput {
  mood: 1 | 2 | 3 | 4 | 5;
  note: string;
}

export type JournalStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface JournalState {
  items: JournalEntry[];
  status: JournalStatus;
  error: string | null;
}
