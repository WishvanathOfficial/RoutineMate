import { JournalEntry } from '../models';
import { JournalEntry as JournalEntryModel } from '../models/journalEntry.model';
import type { SaveJournalEntryInput } from '../validators/journal.validator';

// docs/RoutineMate-MVP2-Scope.md §3.3/§5 "JournalEntry" — one entry per user
// per day; saving again for the same day upserts rather than duplicating.

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDto(entry: JournalEntryModel) {
  return {
    id: entry.id,
    date: entry.date,
    mood: entry.mood,
    note: entry.note,
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function listEntries(userId: string) {
  const entries = await JournalEntry.findAll({ where: { userId }, order: [['date', 'DESC']] });
  return entries.map(toDto);
}

/** Backs GET /api/journal/:date — docs/RoutineMate-MVP2-Scope.md §4 site
 * map's "Single day entry" route. Null (not a 404) when nothing was logged
 * for that day, since "no entry yet" is a normal, expected state here. */
export async function getEntryByDate(userId: string, date: string) {
  const entry = await JournalEntry.findOne({ where: { userId, date } });
  return entry ? toDto(entry) : null;
}

/** Upserts the entry for an explicit date — shared by saveTodayEntry()
 * below and PUT /api/journal/:date (which lets the calendar view back-fill
 * or edit a past day, not just today). */
export async function saveEntryForDate(userId: string, date: string, input: SaveJournalEntryInput) {
  const [entry] = await JournalEntry.findOrCreate({
    where: { userId, date },
    defaults: { userId, date, mood: input.mood, note: input.note },
  });
  // findOrCreate returns the existing row as-is on a hit — apply the new
  // values explicitly so re-saving this date's entry overwrites it.
  entry.mood = input.mood;
  entry.note = input.note;
  await entry.save();
  return toDto(entry);
}

export async function saveTodayEntry(userId: string, input: SaveJournalEntryInput) {
  return saveEntryForDate(userId, todayStr(), input);
}
