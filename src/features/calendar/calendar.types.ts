export type CalendarDayStatus = 'completed' | 'partial' | 'missed' | 'none';

export interface CalendarDay {
  date: number;
  status: CalendarDayStatus;
}

export interface CalendarMonth {
  label: string;
  leadingBlanks: number;
  today: number;
  days: CalendarDay[];
}

export type CalendarStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface CalendarState {
  month: CalendarMonth | null;
  status: CalendarStatus;
}
