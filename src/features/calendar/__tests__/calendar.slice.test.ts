import reducer from '../calendar.slice';
import { fetchCalendarThunk } from '../calendar.thunks';
import type { CalendarMonth, CalendarState } from '../calendar.types';

const initialState: CalendarState = { month: null, status: 'idle' };

const sampleMonth: CalendarMonth = {
  label: 'August 2026',
  leadingBlanks: 6,
  today: 18,
  days: [{ date: 1, status: 'missed' }],
};

describe('calendar.slice', () => {
  it('stores the month on fetch fulfilled', () => {
    const action = { type: fetchCalendarThunk.fulfilled.type, payload: sampleMonth };
    const state = reducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.month).toEqual(sampleMonth);
  });

  it('sets status to loading while fetching', () => {
    const state = reducer(initialState, { type: fetchCalendarThunk.pending.type });
    expect(state.status).toBe('loading');
  });
});
