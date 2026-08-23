import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import {
  fromBackendRoutine,
  toBackendCreatePayload,
  toBackendUpdatePayload,
  type BackendRoutineDto,
} from './routines.mapper';
import type { CreateRoutineInput, Routine, UpdateRoutineInput } from './routines.types';

// Real backend calls — see docs/RoutineMate-Frontend-Backend-Integration-Plan.md
// §2.3 "Routines". Replaces the in-memory routinesDb mock; routines.mapper.ts
// handles the shape translation so routines.thunks.ts / routines.slice.ts /
// RoutineCard.tsx / RoutineFormModal.tsx didn't need to change.

type ListRoutineDto = BackendRoutineDto & { completedToday: boolean };

interface CheckInResponse {
  routine: BackendRoutineDto;
  log: { status: 'done' | 'partial' | 'skipped' | 'missed' };
}

export async function fetchRoutines(): Promise<Routine[]> {
  const dtos = await httpClient.get('/api/routines').then(unwrap<ListRoutineDto[]>);
  return dtos.map((dto) => fromBackendRoutine(dto, dto.completedToday));
}

async function fetchRoutineById(id: string): Promise<Routine> {
  const dto = await httpClient.get(`/api/routines/${id}`).then(unwrap<ListRoutineDto>);
  return fromBackendRoutine(dto, dto.completedToday);
}

export async function createRoutine(input: CreateRoutineInput): Promise<Routine> {
  const dto = await httpClient
    .post('/api/routines', toBackendCreatePayload(input))
    .then(unwrap<BackendRoutineDto>);
  // A routine that was just created can't have a habit_logs row for today yet.
  return fromBackendRoutine(dto, false);
}

export async function updateRoutine(input: UpdateRoutineInput): Promise<Routine> {
  const { id, ...rest } = input;
  await httpClient.put(`/api/routines/${id}`, toBackendUpdatePayload(rest));
  // The update response doesn't include completedToday (editing details
  // doesn't touch habit_logs) — refetch for the authoritative value.
  return fetchRoutineById(id);
}

export async function deleteRoutine(id: string): Promise<{ id: string }> {
  await httpClient.delete(`/api/routines/${id}`);
  return { id };
}

/**
 * The backend has no "toggle" — check-in always records an explicit status
 * for today. `currentlyCompleted` (the routine's completedToday right now)
 * decides which way this toggle press goes: done -> skipped, anything else
 * -> done. See integration plan §2.3, decision (a).
 */
export async function toggleCheckIn(id: string, currentlyCompleted: boolean): Promise<Routine> {
  const status = currentlyCompleted ? 'skipped' : 'done';
  const { routine, log } = await httpClient
    .post(`/api/routines/${id}/check-in`, { status })
    .then(unwrap<CheckInResponse>);
  return fromBackendRoutine(routine, log.status === 'done');
}

export async function togglePause(id: string): Promise<Routine> {
  await httpClient.patch(`/api/routines/${id}/pause`);
  // Pausing/resuming doesn't touch habit_logs — refetch to preserve completedToday.
  return fetchRoutineById(id);
}
