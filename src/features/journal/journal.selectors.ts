import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@app/store';

export const selectJournalStatus = (state: RootState) => state.journal.status;

export const selectAllJournalEntries = (state: RootState) => state.journal.items;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Today's entry, if the user has already journaled today — used to pre-fill the form. */
export const selectTodayJournalEntry = createSelector(
  selectAllJournalEntries,
  (entries) => entries.find((e) => e.date === todayIso()) ?? null,
);

/** Most recent entry — used for the Dashboard "Quick Journal" widget. */
export const selectMostRecentJournalEntry = createSelector(
  selectAllJournalEntries,
  (entries) => entries[0] ?? null,
);

/** Backs the /journal/:date single-day page and the calendar view's day
 * cells — a factory selector, same pattern as routines' selectRoutineById. */
export const selectJournalEntryByDate = (date: string) =>
  createSelector(
    selectAllJournalEntries,
    (entries) => entries.find((e) => e.date === date) ?? null,
  );
