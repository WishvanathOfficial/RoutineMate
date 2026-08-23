import * as calendarService from '../services/calendar.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getMonth = asyncHandler(async (req, res) => {
  const { month } = req.query as { month: string };
  const calendar = await calendarService.getMonthCalendar(req.user!.sub, month);
  ApiResponse.ok(res, calendar);
});
