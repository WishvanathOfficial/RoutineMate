export type CalendarDayStatus = 'completed' | 'partial' | 'missed' | 'none';

export interface CalendarDay {
  date: number;
  status: CalendarDayStatus;
  completed: number;
  total: number;
}

export interface CalendarMonth {
  month: string;
  label: string;
  leadingBlanks: number;
  today: number;
  days: CalendarDay[];
}

export type CalendarStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface CalendarState {
  month: CalendarMonth | null;
  status: CalendarStatus;
  error: string | null;
}

export interface CalendarConnection {
  id: string;
  provider: 'google' | 'apple';
  status: string;
  expiresAt: string | null;
}
