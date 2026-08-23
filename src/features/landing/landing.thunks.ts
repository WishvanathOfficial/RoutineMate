import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchTestimonials, subscribeToNewsletter } from './landing.api';
import type { Testimonial } from './landing.types';

export const fetchTestimonialsThunk = createAsyncThunk<Testimonial[]>(
  'landing/fetchTestimonials',
  async () => fetchTestimonials(),
);

export const subscribeThunk = createAsyncThunk<{ email: string }, string>(
  'landing/subscribe',
  async (email) => subscribeToNewsletter(email),
);
