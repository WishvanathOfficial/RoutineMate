import type { RootState } from '@app/store';

export const selectTestimonials = (state: RootState) => state.landing.testimonials;
export const selectNewsletterStatus = (state: RootState) => state.landing.newsletterStatus;
