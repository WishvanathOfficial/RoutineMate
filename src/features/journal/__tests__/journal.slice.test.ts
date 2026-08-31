import reducer from '../journal.slice';
import { createJournalEntryThunk, fetchJournalEntriesThunk } from '../journal.thunks';
import type { JournalEntry, JournalState } from '../journal.types';

const sampleEntry: JournalEntry = {
  id: 'entry-1',
  date: '2026-08-23',
  mood: 4,
  note: 'Felt productive today.',
  createdAt: '2026-08-23T20:00:00.000Z',
};

const initialState: JournalState = { items: [], status: 'idle', error: null };

describe('journal.slice', () => {
  it('sets loading status while fetching entries', () => {
    const action = { type: fetchJournalEntriesThunk.pending.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('loading');
  });

  it('stores entries on fetch fulfilled', () => {
    const action = { type: fetchJournalEntriesThunk.fulfilled.type, payload: [sampleEntry] };
    const state = reducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.items).toHaveLength(1);
  });

  it('prepends a new entry for a new date on create fulfilled', () => {
    const seeded: JournalState = { ...initialState, items: [sampleEntry] };
    const newEntry: JournalEntry = {
      id: 'entry-2',
      date: '2026-08-24',
      mood: 5,
      note: 'Great day!',
      createdAt: '2026-08-24T09:00:00.000Z',
    };
    const action = { type: createJournalEntryThunk.fulfilled.type, payload: newEntry };
    const state = reducer(seeded, action);
    expect(state.items).toHaveLength(2);
    expect(state.items[0].id).toBe('entry-2');
  });

  it('replaces the existing entry for the same date on create fulfilled', () => {
    const seeded: JournalState = { ...initialState, items: [sampleEntry] };
    const updatedEntry: JournalEntry = {
      ...sampleEntry,
      id: 'entry-1b',
      mood: 2,
      note: 'Updated my mood for today.',
    };
    const action = { type: createJournalEntryThunk.fulfilled.type, payload: updatedEntry };
    const state = reducer(seeded, action);
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe('entry-1b');
    expect(state.items[0].mood).toBe(2);
  });

  it('stores the extracted error message when fetch is rejected', () => {
    const action = { type: fetchJournalEntriesThunk.rejected.type, payload: 'Network error' };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network error');
  });

  it('falls back to a generic message when fetch is rejected without a payload', () => {
    const action = { type: fetchJournalEntriesThunk.rejected.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Failed to load journal entries.');
  });
});
