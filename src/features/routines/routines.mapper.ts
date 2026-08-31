// Translates between the frontend's UI-friendly Routine shape and the
// backend's normalized DB shape — see
// docs/RoutineMate-Frontend-Backend-Integration-Plan.md §2.3 "Routines" for
// the full list of differences this exists to paper over.
import type {
  CreateRoutineInput,
  ReminderType,
  Routine,
  RoutineCategory,
  RoutineFrequency,
  RoutineStatus,
} from './routines.types';

export type BackendFrequencyType = 'daily' | 'weekdays' | 'specific_days' | 'interval';

export interface BackendFrequencyConfig {
  days?: number[];
  everyNDays?: number;
}

export type BackendRoutineStatus = 'active' | 'paused' | 'archived';

// Shape returned by the backend for a single routine — see
// backend/src/models/routine.model.ts. `completedToday` is only present on
// GET /routines and GET /routines/:id responses (the service computes it);
// mutation endpoints (create/update/pause/check-in) don't include it.
export interface BackendRoutineDto {
  id: string;
  name: string;
  emoji: string;
  category: RoutineCategory;
  frequencyType: BackendFrequencyType;
  frequencyConfig: BackendFrequencyConfig | null;
  visibility?: 'private' | 'friends' | 'public';
  reminderType: ReminderType;
  reminderTime: string | null;
  reminderLocation: string | null;
  status: BackendRoutineStatus;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  completedToday?: boolean;
}

const MON_WED_FRI = [1, 3, 5];

/** Frontend frequency label -> backend frequencyType + frequencyConfig. */
export function toBackendFrequency(frequency: RoutineFrequency): {
  frequencyType: BackendFrequencyType;
  frequencyConfig: BackendFrequencyConfig | null;
} {
  switch (frequency) {
    case 'Daily':
      return { frequencyType: 'daily', frequencyConfig: null };
    case 'Weekdays':
      return { frequencyType: 'weekdays', frequencyConfig: null };
    case 'Mon/Wed/Fri':
      return { frequencyType: 'specific_days', frequencyConfig: { days: MON_WED_FRI } };
    case 'Custom':
    default:
      // RoutineFormModal has no custom-schedule UI yet (no day picker or
      // interval input) — 'every 2 days' is a documented placeholder until
      // it does. See integration plan §2.3 open decision.
      return { frequencyType: 'interval', frequencyConfig: { everyNDays: 2 } };
  }
}

/** Backend frequencyType + frequencyConfig -> frontend display label. */
export function fromBackendFrequency(
  frequencyType: BackendFrequencyType,
  frequencyConfig: BackendFrequencyConfig | null,
): RoutineFrequency {
  switch (frequencyType) {
    case 'daily':
      return 'Daily';
    case 'weekdays':
      return 'Weekdays';
    case 'specific_days': {
      const days = [...(frequencyConfig?.days ?? [])].sort((a, b) => a - b);
      const isMonWedFri =
        days.length === MON_WED_FRI.length && days.every((d, i) => d === MON_WED_FRI[i]);
      return isMonWedFri ? 'Mon/Wed/Fri' : 'Custom';
    }
    case 'interval':
    default:
      return 'Custom';
  }
}

/**
 * The frontend has no third state and no UI action ever produces 'archived'
 * (it's a Phase-2 soft-delete concept on the backend) — collapse it into
 * 'paused' rather than widening RoutineStatus for a state nothing can set.
 */
function fromBackendStatus(status: BackendRoutineStatus): RoutineStatus {
  return status === 'active' ? 'active' : 'paused';
}

export function fromBackendRoutine(dto: BackendRoutineDto, completedToday: boolean): Routine {
  return {
    id: dto.id,
    name: dto.name,
    emoji: dto.emoji,
    category: dto.category,
    frequency: fromBackendFrequency(dto.frequencyType, dto.frequencyConfig),
    reminderType: dto.reminderType,
    reminderTime: dto.reminderTime ?? '',
    reminderLocation: dto.reminderLocation,
    status: fromBackendStatus(dto.status),
    streak: dto.currentStreak,
    longestStreak: dto.longestStreak,
    completedToday,
    visibility: dto.visibility ?? 'private',
    createdAt: dto.createdAt,
  };
}

export function toBackendCreatePayload(input: CreateRoutineInput): Record<string, unknown> {
  const { frequencyType, frequencyConfig } = toBackendFrequency(input.frequency);
  return {
    name: input.name,
    emoji: input.emoji,
    category: input.category,
    frequencyType,
    frequencyConfig: frequencyConfig ?? undefined,
    reminderType: input.reminderType,
    reminderTime: input.reminderType === 'time' ? input.reminderTime : undefined,
    reminderLocation:
      input.reminderType === 'location' ? (input.reminderLocation ?? undefined) : undefined,
  };
}

/**
 * Best-effort local check-in update used only while offline (see
 * routines.thunks.ts's toggleCheckInThunk + src/offline/offlineCheckInQueue.ts)
 * — the server is the source of truth for streak math and will overwrite
 * this the moment the queued check-in actually syncs. This just needs to
 * make the UI feel right in the meantime: flip completedToday and nudge
 * streak/longestStreak by one in the matching direction.
 */
export function applyOptimisticCheckIn(routine: Routine, status: 'done' | 'skipped'): Routine {
  const completedToday = status === 'done';
  if (completedToday === routine.completedToday) return routine;

  const streak = completedToday ? routine.streak + 1 : Math.max(0, routine.streak - 1);

  return {
    ...routine,
    completedToday,
    streak,
    longestStreak: Math.max(routine.longestStreak, streak),
  };
}

export function toBackendUpdatePayload(
  input: Partial<CreateRoutineInput>,
): Record<string, unknown> {
  const { frequency, ...rest } = input;
  const payload: Record<string, unknown> = { ...rest };
  if (frequency) {
    const { frequencyType, frequencyConfig } = toBackendFrequency(frequency);
    payload.frequencyType = frequencyType;
    if (frequencyConfig) payload.frequencyConfig = frequencyConfig;
  }
  return payload;
}
