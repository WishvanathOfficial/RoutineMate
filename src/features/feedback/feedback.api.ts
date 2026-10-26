import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import type { CreateFeedbackInput, FeedbackItem, FeedbackStatusFilter } from './feedback.types';

export async function fetchFeedback(status: FeedbackStatusFilter = 'all'): Promise<FeedbackItem[]> {
  const response = await httpClient
    .get('/api/feedback', { params: status === 'all' ? {} : { status } })
    .then(unwrap<FeedbackItem[]>);
  return response;
}

export async function fetchPublicRoadmap(): Promise<FeedbackItem[]> {
  return httpClient.get('/api/roadmap').then(unwrap<FeedbackItem[]>);
}

export async function createFeedback(input: CreateFeedbackInput): Promise<FeedbackItem> {
  return httpClient.post('/api/feedback', input).then(unwrap<FeedbackItem>);
}

export async function setFeedbackVote(itemId: string, hasVoted: boolean): Promise<FeedbackItem> {
  const url = `/api/feedback/${itemId}/votes`;
  return (hasVoted ? httpClient.delete(url) : httpClient.post(url)).then(unwrap<FeedbackItem>);
}
