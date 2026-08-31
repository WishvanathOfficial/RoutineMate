jest.mock('../../models', () => ({
  OnboardingState: { findOrCreate: jest.fn() },
}));

import { OnboardingState } from '../../models';
import * as onboardingService from '../onboarding.service';

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'u1',
    completed: false,
    completedAt: null,
    categories: null,
    reminderTime: null,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('onboarding.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOnboardingState', () => {
    it('creates a default state on first fetch for a user with none yet', async () => {
      const state = makeState();
      (OnboardingState.findOrCreate as jest.Mock).mockResolvedValue([state, true]);

      const dto = await onboardingService.getOnboardingState('u1');

      expect(OnboardingState.findOrCreate).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        defaults: { userId: 'u1' },
      });
      expect(dto).toEqual({
        completed: false,
        completedAt: null,
        categories: [],
        reminderTime: null,
      });
    });

    it('returns the existing state for a user who already has a row', async () => {
      const completedAt = new Date('2026-08-01T10:00:00Z');
      const state = makeState({
        completed: true,
        completedAt,
        categories: ['Health', 'Learning'],
        reminderTime: '08:00:00',
      });
      (OnboardingState.findOrCreate as jest.Mock).mockResolvedValue([state, false]);

      const dto = await onboardingService.getOnboardingState('u1');

      expect(dto).toEqual({
        completed: true,
        completedAt: completedAt.toISOString(),
        categories: ['Health', 'Learning'],
        reminderTime: '08:00:00',
      });
    });

    it('defaults categories to an empty array when null', async () => {
      const state = makeState({ categories: null });
      (OnboardingState.findOrCreate as jest.Mock).mockResolvedValue([state, false]);

      const dto = await onboardingService.getOnboardingState('u1');

      expect(dto.categories).toEqual([]);
    });
  });

  describe('completeOnboarding', () => {
    it('marks the state completed and stores categories + reminderTime when provided', async () => {
      const state = makeState();
      (OnboardingState.findOrCreate as jest.Mock).mockResolvedValue([state, false]);

      const result = await onboardingService.completeOnboarding('u1', {
        categories: ['Wellness'],
        reminderTime: '09:30:00',
      });

      expect(state.completed).toBe(true);
      expect(state.completedAt).toBeInstanceOf(Date);
      expect(state.categories).toEqual(['Wellness']);
      expect(state.reminderTime).toBe('09:30:00');
      expect(state.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ completed: true });
    });

    it('leaves reminderTime unchanged when the input omits it', async () => {
      const state = makeState({ reminderTime: '07:00:00' });
      (OnboardingState.findOrCreate as jest.Mock).mockResolvedValue([state, false]);

      const result = await onboardingService.completeOnboarding('u1', {
        categories: [],
      });

      expect(state.completed).toBe(true);
      expect(state.categories).toEqual([]);
      expect(state.reminderTime).toBe('07:00:00');
      expect(state.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ completed: true });
    });

    it('creates the state via findOrCreate when the user has none yet', async () => {
      const state = makeState();
      (OnboardingState.findOrCreate as jest.Mock).mockResolvedValue([state, true]);

      await onboardingService.completeOnboarding('u2', { categories: ['Health'] });

      expect(OnboardingState.findOrCreate).toHaveBeenCalledWith({
        where: { userId: 'u2' },
        defaults: { userId: 'u2' },
      });
      expect(state.save).toHaveBeenCalledTimes(1);
    });
  });
});
