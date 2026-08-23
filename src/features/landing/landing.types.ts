export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  rating: number;
}

export type NewsletterStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface LandingState {
  testimonials: Testimonial[];
  newsletterStatus: NewsletterStatus;
}
