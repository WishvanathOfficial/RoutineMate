import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractApiErrorMessage } from '@api/apiError';
import { createGoal, fetchGoals, toggleGoalMilestone } from './goals.api';
import type { CreateGoalInput, Goal } from './goals.types';

export const fetchGoalsThunk = createAsyncThunk<Goal[], void, { rejectValue: string }>(
  'goals/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchGoals();
    } catch (err) {
      return rejectWithValue(extractApiErrorMessage(err, 'Failed to load goals.'));
    }
  },
);

export const createGoalThunk = createAsyncThunk<Goal, CreateGoalInput, { rejectValue: string }>(
  'goals/create',
  async (input, { rejectWithValue }) => {
    try {
      return await createGoal(input);
    } catch (err) {
      return rejectWithValue(extractApiErrorMessage(err, 'Failed to create goal.'));
    }
  },
);

export interface ToggleGoalMilestoneArgs {
  goalId: string;
  milestoneId: string;
}

export const toggleGoalMilestoneThunk = createAsyncThunk<
  Goal,
  ToggleGoalMilestoneArgs,
  { rejectValue: string }
>('goals/toggleMilestone', async ({ goalId, milestoneId }, { rejectWithValue }) => {
  try {
    return await toggleGoalMilestone(goalId, milestoneId);
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to update milestone.'));
  }
});
