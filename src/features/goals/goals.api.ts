import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import type { CreateGoalInput, Goal } from './goals.types';

// Real backend calls — see backend/src/services/goals.service.ts. The
// backend DTO shape matches the frontend Goal type exactly (progress is
// computed server-side from the linked routines' live streaks), so no
// mapper is needed here, unlike routines.api.ts.

export async function fetchGoals(): Promise<Goal[]> {
  return httpClient.get('/api/goals').then(unwrap<Goal[]>);
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  return httpClient.post('/api/goals', input).then(unwrap<Goal>);
}

export async function toggleGoalMilestone(goalId: string, milestoneId: string): Promise<Goal> {
  return httpClient.patch(`/api/goals/${goalId}/milestones/${milestoneId}`).then(unwrap<Goal>);
}
export async function deleteGoal(id: string): Promise<void> {
  await httpClient.delete(`/api/goals/${id}`);
}
