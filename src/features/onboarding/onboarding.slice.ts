import { createSlice } from '@reduxjs/toolkit';
import type { OnboardingState } from './onboarding.types';
import { completeOnboardingThunk, fetchOnboardingStateThunk } from './onboarding.thunks';

const initialState: OnboardingState = {
  completed: false,
  status: 'idle',
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(completeOnboardingThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(completeOnboardingThunk.fulfilled, (state) => {
        state.status = 'succeeded';
        state.completed = true;
      })
      .addCase(completeOnboardingThunk.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(fetchOnboardingStateThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOnboardingStateThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.completed = action.payload.completed;
      })
      .addCase(fetchOnboardingStateThunk.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default onboardingSlice.reducer;
