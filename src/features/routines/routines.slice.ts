import { createSlice } from '@reduxjs/toolkit';
import type { RoutinesState } from './routines.types';
import {
  createRoutineThunk,
  deleteRoutineThunk,
  fetchRoutinesThunk,
  toggleCheckInThunk,
  togglePauseThunk,
  updateRoutineThunk,
} from './routines.thunks';

const initialState: RoutinesState = {
  items: [],
  status: 'idle',
  error: null,
};

const routinesSlice = createSlice({
  name: 'routines',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoutinesThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRoutinesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchRoutinesThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load routines.';
      })
      .addCase(createRoutineThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateRoutineThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteRoutineThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload.id);
      })
      .addCase(toggleCheckInThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(togglePauseThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export default routinesSlice.reducer;
