import { createSlice } from '@reduxjs/toolkit';
import type { GoalsState } from './goals.types';
import { createGoalThunk, fetchGoalsThunk, toggleGoalMilestoneThunk } from './goals.thunks';

const initialState: GoalsState = {
  items: [],
  status: 'idle',
  error: null,
};

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoalsThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchGoalsThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchGoalsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load goals.';
      })
      .addCase(createGoalThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(toggleGoalMilestoneThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((g) => g.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export default goalsSlice.reducer;
