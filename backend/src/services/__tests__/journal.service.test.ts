jest.mock('../../models', () => ({
  JournalEntry: { findAll: jest.fn(), findOne: jest.fn(), findOrCreate: jest.fn() },
}));

import { JournalEntry } from '../../models';
import * as journalService from '../journal.service';

describe('journal.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-20T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('listEntries', () => {
    it('returns an empty array when the user has no journal entries', async () => {
      (JournalEntry.findAll as jest.Mock).mockResolvedValue([]);

      const entries = await journalService.listEntries('u1');

      expect(entries).toEqual([]);
      expect(JournalEntry.findAll).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        order: [['date', 'DESC']],
      });
    });

    it('maps entries newest-first into DTOs', async () => {
      const createdAt = new Date('2026-08-19T08:00:00Z');
      (JournalEntry.findAll as jest.Mock).mockResolvedValue([
        { id: 'e2', date: '2026-08-20', mood: 4, note: 'Great day', createdAt },
        { id: 'e1', date: '2026-08-19', mood: 2, note: 'Rough day', createdAt },
      ]);

      const entries = await journalService.listEntries('u1');

      expect(entries).toEqual([
        {
          id: 'e2',
          date: '2026-08-20',
          mood: 4,
          note: 'Great day',
          createdAt: createdAt.toISOString(),
        },
        {
          id: 'e1',
          date: '2026-08-19',
          mood: 2,
          note: 'Rough day',
          createdAt: createdAt.toISOString(),
        },
      ]);
    });
  });

  describe('saveTodayEntry', () => {
    it('creates a new entry for today when none exists yet', async () => {
      const createdAt = new Date('2026-08-20T12:00:00Z');
      const entry = {
        id: 'new-entry',
        userId: 'u1',
        date: '2026-08-20',
        mood: 4,
        note: 'First entry today',
        createdAt,
        save: jest.fn().mockResolvedValue(undefined),
      };
      (JournalEntry.findOrCreate as jest.Mock).mockResolvedValue([entry, true]);

      const result = await journalService.saveTodayEntry('u1', {
        mood: 4,
        note: 'First entry today',
      });

      expect(JournalEntry.findOrCreate).toHaveBeenCalledWith({
        where: { userId: 'u1', date: '2026-08-20' },
        defaults: { userId: 'u1', date: '2026-08-20', mood: 4, note: 'First entry today' },
      });
      expect(entry.mood).toBe(4);
      expect(entry.note).toBe('First entry today');
      expect(entry.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: 'new-entry',
        date: '2026-08-20',
        mood: 4,
        note: 'First entry today',
        createdAt: createdAt.toISOString(),
      });
    });

    it('overwrites an existing entry for today instead of duplicating it', async () => {
      const createdAt = new Date('2026-08-20T07:00:00Z');
      const entry = {
        id: 'existing-entry',
        userId: 'u1',
        date: '2026-08-20',
        mood: 2,
        note: 'Original note',
        createdAt,
        save: jest.fn().mockResolvedValue(undefined),
      };
      (JournalEntry.findOrCreate as jest.Mock).mockResolvedValue([entry, false]);

      const result = await journalService.saveTodayEntry('u1', {
        mood: 5,
        note: 'Updated note',
      });

      expect(JournalEntry.findOrCreate).toHaveBeenCalledWith({
        where: { userId: 'u1', date: '2026-08-20' },
        defaults: { userId: 'u1', date: '2026-08-20', mood: 5, note: 'Updated note' },
      });
      // The pre-existing values are overwritten rather than left untouched.
      expect(entry.mood).toBe(5);
      expect(entry.note).toBe('Updated note');
      expect(entry.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: 'existing-entry',
        date: '2026-08-20',
        mood: 5,
        note: 'Updated note',
        createdAt: createdAt.toISOString(),
      });
    });

    it('always keys the upsert off the current calendar date', async () => {
      jest.setSystemTime(new Date('2026-01-01T23:30:00Z'));
      const entry = {
        id: 'e3',
        userId: 'u1',
        date: '2026-01-01',
        mood: 3,
        note: 'note',
        createdAt: new Date('2026-01-01T23:30:00Z'),
        save: jest.fn().mockResolvedValue(undefined),
      };
      (JournalEntry.findOrCreate as jest.Mock).mockResolvedValue([entry, true]);

      await journalService.saveTodayEntry('u1', { mood: 3, note: 'note' });

      expect(JournalEntry.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1', date: '2026-01-01' } }),
      );
    });
  });

  describe('getEntryByDate', () => {
    it('returns null when no entry exists for that date', async () => {
      (JournalEntry.findOne as jest.Mock).mockResolvedValue(null);

      const result = await journalService.getEntryByDate('u1', '2026-08-15');

      expect(JournalEntry.findOne).toHaveBeenCalledWith({
        where: { userId: 'u1', date: '2026-08-15' },
      });
      expect(result).toBeNull();
    });

    it('maps an existing entry to a dto', async () => {
      const createdAt = new Date('2026-08-15T09:00:00Z');
      (JournalEntry.findOne as jest.Mock).mockResolvedValue({
        id: 'e1',
        date: '2026-08-15',
        mood: 3,
        note: 'A day',
        createdAt,
      });

      const result = await journalService.getEntryByDate('u1', '2026-08-15');

      expect(result).toEqual({
        id: 'e1',
        date: '2026-08-15',
        mood: 3,
        note: 'A day',
        createdAt: createdAt.toISOString(),
      });
    });
  });

  describe('saveEntryForDate', () => {
    it('upserts the entry for the given date rather than the current date', async () => {
      const createdAt = new Date('2026-08-10T00:00:00Z');
      const entry = {
        id: 'e1',
        date: '2026-08-10',
        mood: 1,
        note: 'Old note',
        createdAt,
        save: jest.fn().mockResolvedValue(undefined),
      };
      (JournalEntry.findOrCreate as jest.Mock).mockResolvedValue([entry, false]);

      const result = await journalService.saveEntryForDate('u1', '2026-08-10', {
        mood: 5,
        note: 'Backfilled note',
      });

      expect(JournalEntry.findOrCreate).toHaveBeenCalledWith({
        where: { userId: 'u1', date: '2026-08-10' },
        defaults: { userId: 'u1', date: '2026-08-10', mood: 5, note: 'Backfilled note' },
      });
      expect(entry.mood).toBe(5);
      expect(entry.note).toBe('Backfilled note');
      expect(result.date).toBe('2026-08-10');
    });
  });
});
