export type RoutineCategory = 'Health' | 'Mindfulness' | 'Learning' | 'Wellness' | 'Productivity';

export type RoutineFrequency = 'Daily' | 'Mon/Wed/Fri' | 'Weekdays' | 'Custom';

export type ReminderType = 'time' | 'location';

export type RoutineStatus = 'active' | 'paused';

export interface Routine {
  id: string;
  name: string;
  emoji: string;
  category: RoutineCategory;
  frequency: RoutineFrequency;
  reminderType: ReminderType;
  reminderTime: string;
  reminderLocation: string | null;
  status: RoutineStatus;
  streak: number;
  longestStreak: number;
  completedToday: boolean;
  createdAt: string;
}

export interface RoutineTemplate {
  emoji: string;
  name: string;
  category: RoutineCategory;
  frequency: RoutineFrequency;
  reminderTime: string;
}

export interface CreateRoutineInput {
  name: string;
  emoji: string;
  category: RoutineCategory;
  frequency: RoutineFrequency;
  reminderType: ReminderType;
  reminderTime: string;
  reminderLocation?: string | null;
}

export type UpdateRoutineInput = Partial<CreateRoutineInput> & { id: string };

export type RoutinesStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface RoutinesState {
  items: Routine[];
  status: RoutinesStatus;
  error: string | null;
}

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    emoji: '💧',
    name: 'Drink Water',
    category: 'Health',
    frequency: 'Daily',
    reminderTime: '08:00',
  },
  {
    emoji: '🧘',
    name: 'Meditate',
    category: 'Mindfulness',
    frequency: 'Daily',
    reminderTime: '06:30',
  },
  {
    emoji: '📚',
    name: 'Read 20 pages',
    category: 'Learning',
    frequency: 'Daily',
    reminderTime: '21:00',
  },
  {
    emoji: '🏃',
    name: 'Exercise',
    category: 'Health',
    frequency: 'Mon/Wed/Fri',
    reminderTime: '06:00',
  },
  {
    emoji: '😴',
    name: 'Sleep by 11 PM',
    category: 'Wellness',
    frequency: 'Daily',
    reminderTime: '23:00',
  },
  {
    emoji: '🚭',
    name: 'Quit Smoking',
    category: 'Health',
    frequency: 'Daily',
    reminderTime: '09:00',
  },
  {
    emoji: '✍️',
    name: 'Journal',
    category: 'Mindfulness',
    frequency: 'Daily',
    reminderTime: '21:30',
  },
  {
    emoji: '🥗',
    name: 'Eat Healthy',
    category: 'Wellness',
    frequency: 'Daily',
    reminderTime: '12:00',
  },
];
