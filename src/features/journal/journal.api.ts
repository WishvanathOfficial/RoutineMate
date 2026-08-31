import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import type { CreateJournalEntryInput, JournalEntry } from './journal.types';

// Real backend calls — see backend/src/services/journal.service.ts.

interface BackendJournalEntryDto {
  id: string;
  date: string;
  mood: number;
  note: string;
  createdAt: string;
}

/** The backend stores mood as a plain TINYINT column — narrow it back to
 * the frontend's 1-5 literal union rather than widening JournalEntry's type
 * for a value that's always validated to that range server-side. */
function toMoodLiteral(mood: number): 1 | 2 | 3 | 4 | 5 {
  return Math.min(5, Math.max(1, Math.round(mood))) as 1 | 2 | 3 | 4 | 5;
}

function fromBackendEntry(dto: BackendJournalEntryDto): JournalEntry {
  return {
    id: dto.id,
    date: dto.date,
    mood: toMoodLiteral(dto.mood),
    note: dto.note,
    createdAt: dto.createdAt,
  };
}

export async function fetchJournalEntries(): Promise<JournalEntry[]> {
  const dtos = await httpClient.get('/api/journal').then(unwrap<BackendJournalEntryDto[]>);
  return dtos.map(fromBackendEntry);
}

export async function createJournalEntry(input: CreateJournalEntryInput): Promise<JournalEntry> {
  const dto = await httpClient.post('/api/journal', input).then(unwrap<BackendJournalEntryDto>);
  return fromBackendEntry(dto);
}

// docs/RoutineMate-MVP2-Scope.md §4 site map: "/journal/:date — Single day
// entry" — see backend/src/services/journal.service.ts's
// getEntryByDate()/saveEntryForDate().
export async function fetchJournalEntryByDate(date: string): Promise<JournalEntry | null> {
  const dto = await httpClient
    .get(`/api/journal/${date}`)
    .then(unwrap<BackendJournalEntryDto | null>);
  return dto ? fromBackendEntry(dto) : null;
}

export async function saveJournalEntryForDate(
  date: string,
  input: CreateJournalEntryInput,
): Promise<JournalEntry> {
  const dto = await httpClient
    .put(`/api/journal/${date}`, input)
    .then(unwrap<BackendJournalEntryDto>);
  return fromBackendEntry(dto);
}
