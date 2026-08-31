import * as journalService from '../services/journal.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const entries = await journalService.listEntries(req.user!.sub);
  ApiResponse.ok(res, entries);
});

export const save = asyncHandler(async (req, res) => {
  const entry = await journalService.saveTodayEntry(req.user!.sub, req.body);
  ApiResponse.created(res, entry, 'Journal entry saved');
});

export const getByDate = asyncHandler(async (req, res) => {
  const entry = await journalService.getEntryByDate(req.user!.sub, req.params.date);
  ApiResponse.ok(res, entry);
});

export const saveForDate = asyncHandler(async (req, res) => {
  const entry = await journalService.saveEntryForDate(req.user!.sub, req.params.date, req.body);
  ApiResponse.ok(res, entry, 'Journal entry saved');
});
