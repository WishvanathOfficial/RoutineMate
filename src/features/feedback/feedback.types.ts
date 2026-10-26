export type FeedbackStatus = 'planned' | 'in-progress' | 'shipped';
export type FeedbackStatusFilter = 'all' | FeedbackStatus;

export interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: FeedbackStatus;
  createdAt: string;
  hasVoted: boolean;
}

export interface CreateFeedbackInput {
  title: string;
  description: string;
}

export const FEEDBACK_STATUSES: Array<{
  value: FeedbackStatus;
  label: string;
}> = [
  { value: 'planned', label: 'Under review' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'shipped', label: 'Shipped' },
];

export function feedbackStatusLabel(status: FeedbackStatus): string {
  return FEEDBACK_STATUSES.find((item) => item.value === status)?.label ?? 'Under review';
}

export function formatFeedbackDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
