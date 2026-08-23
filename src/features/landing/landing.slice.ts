import { createSlice } from '@reduxjs/toolkit';
import type { LandingState } from './landing.types';
import { fetchTestimonialsThunk, subscribeThunk } from './landing.thunks';

const initialState: LandingState = {
  testimonials: [],
  newsletterStatus: 'idle',
};

const landingSlice = createSlice({
  name: 'landing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTestimonialsThunk.fulfilled, (state, action) => {
        state.testimonials = action.payload;
      })
      .addCase(subscribeThunk.pending, (state) => {
        state.newsletterStatus = 'loading';
      })
      .addCase(subscribeThunk.fulfilled, (state) => {
        state.newsletterStatus = 'succeeded';
      })
      .addCase(subscribeThunk.rejected, (state) => {
        state.newsletterStatus = 'failed';
      });
  },
});

export default landingSlice.reducer;
