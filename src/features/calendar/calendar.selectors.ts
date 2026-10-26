import type { RootState } from '@app/store';

export const selectCalendarMonth = (state: RootState) => state.calendar.month;
export const selectCalendarStatus = (state: RootState) => state.calendar.status;
export const selectCalendarError = (state: RootState) => state.calendar.error;
