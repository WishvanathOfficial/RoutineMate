jest.mock('../../services/journal.service');

import { Request } from 'express';
import * as journalService from '../../services/journal.service';
import * as journalController from '../journal.controller';
import { mockRes } from './testHelpers';

describe('journal.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns the journal entries for the authenticated user', async () => {
      const entries = [{ id: 'e1', date: '2026-08-20', mood: 4, note: 'Good day' }];
      (journalService.listEntries as jest.Mock).mockResolvedValue(entries);
      const req = { user: { sub: 'u1' } } as unknown as Request;
      const res = mockRes();

      await journalController.list(req, res, jest.fn());

      expect(journalService.listEntries).toHaveBeenCalledWith('u1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: entries }));
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = new Error('boom');
      (journalService.listEntries as jest.Mock).mockRejectedValue(error);
      const req = { user: { sub: 'u1' } } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await journalController.list(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('save', () => {
    it('returns 201 with the upserted journal entry', async () => {
      const entry = { id: 'e1', date: '2026-08-20', mood: 5, note: 'Great day' };
      (journalService.saveTodayEntry as jest.Mock).mockResolvedValue(entry);
      const req = {
        user: { sub: 'u1' },
        body: { mood: 5, note: 'Great day' },
      } as unknown as Request;
      const res = mockRes();

      await journalController.save(req, res, jest.fn());

      expect(journalService.saveTodayEntry).toHaveBeenCalledWith('u1', req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: entry, message: 'Journal entry saved' }),
      );
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = new Error('boom');
      (journalService.saveTodayEntry as jest.Mock).mockRejectedValue(error);
      const req = {
        user: { sub: 'u1' },
        body: { mood: 5, note: 'Great day' },
      } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await journalController.save(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getByDate', () => {
    it('returns the entry for the requested date', async () => {
      const entry = { id: 'e1', date: '2026-08-15', mood: 3, note: 'A day' };
      (journalService.getEntryByDate as jest.Mock).mockResolvedValue(entry);
      const req = { user: { sub: 'u1' }, params: { date: '2026-08-15' } } as unknown as Request;
      const res = mockRes();

      await journalController.getByDate(req, res, jest.fn());

      expect(journalService.getEntryByDate).toHaveBeenCalledWith('u1', '2026-08-15');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: entry }));
    });

    it('returns null data when nothing was logged for that date', async () => {
      (journalService.getEntryByDate as jest.Mock).mockResolvedValue(null);
      const req = { user: { sub: 'u1' }, params: { date: '2026-08-15' } } as unknown as Request;
      const res = mockRes();

      await journalController.getByDate(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: null }));
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = new Error('boom');
      (journalService.getEntryByDate as jest.Mock).mockRejectedValue(error);
      const req = { user: { sub: 'u1' }, params: { date: '2026-08-15' } } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await journalController.getByDate(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('saveForDate', () => {
    it('saves the entry for the requested date', async () => {
      const entry = { id: 'e1', date: '2026-08-10', mood: 5, note: 'Backfilled' };
      (journalService.saveEntryForDate as jest.Mock).mockResolvedValue(entry);
      const req = {
        user: { sub: 'u1' },
        params: { date: '2026-08-10' },
        body: { mood: 5, note: 'Backfilled' },
      } as unknown as Request;
      const res = mockRes();

      await journalController.saveForDate(req, res, jest.fn());

      expect(journalService.saveEntryForDate).toHaveBeenCalledWith('u1', '2026-08-10', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: entry, message: 'Journal entry saved' }),
      );
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = new Error('boom');
      (journalService.saveEntryForDate as jest.Mock).mockRejectedValue(error);
      const req = {
        user: { sub: 'u1' },
        params: { date: '2026-08-10' },
        body: { mood: 5, note: 'Backfilled' },
      } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await journalController.saveForDate(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
