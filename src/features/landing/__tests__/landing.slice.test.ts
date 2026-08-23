import reducer from '../landing.slice';
import { fetchTestimonialsThunk, subscribeThunk } from '../landing.thunks';
import type { LandingState, Testimonial } from '../landing.types';

const initialState: LandingState = { testimonials: [], newsletterStatus: 'idle' };

const sampleTestimonials: Testimonial[] = [
  { id: 't1', quote: 'Great app!', author: 'Sara K.', rating: 5 },
];

describe('landing.slice', () => {
  it('stores testimonials on fetch fulfilled', () => {
    const action = { type: fetchTestimonialsThunk.fulfilled.type, payload: sampleTestimonials };
    const state = reducer(initialState, action);
    expect(state.testimonials).toEqual(sampleTestimonials);
  });

  it('tracks newsletter subscription status', () => {
    const loading = reducer(initialState, { type: subscribeThunk.pending.type });
    expect(loading.newsletterStatus).toBe('loading');

    const succeeded = reducer(loading, {
      type: subscribeThunk.fulfilled.type,
      payload: { email: 'jane@example.com' },
    });
    expect(succeeded.newsletterStatus).toBe('succeeded');
  });
});
