import type { Testimonial } from './landing.types';

const networkDelay = <T>(value: T, ms = 250): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote:
      "Finally a habit tracker that doesn't feel like homework. The streaks keep me coming back every morning.",
    author: 'Sara K.',
    rating: 5,
  },
  {
    id: 't2',
    quote:
      'I love that I can see my whole month at a glance. Seeing the calendar fill in green is oddly addictive.',
    author: 'Marcus R.',
    rating: 5,
  },
  {
    id: 't3',
    quote:
      'Setup took two minutes thanks to the habit templates. I was tracking water, meditation and reading right away.',
    author: 'Priya J.',
    rating: 4,
  },
];

export async function fetchTestimonials(): Promise<Testimonial[]> {
  return networkDelay(TESTIMONIALS);
}

export async function subscribeToNewsletter(email: string): Promise<{ email: string }> {
  return networkDelay({ email });
}
