jest.mock('../../services/onboarding.service');

import { Request } from 'express';
import * as onboardingService from '../../services/onboarding.service';
import * as onboardingController from '../onboarding.controller';
import { mockRes } from './testHelpers';

describe('onboarding.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getState', () => {
    it('returns the onboarding state for the authenticated user', async () => {
      const state = { completed: false, completedAt: null, categories: [], reminderTime: null };
      (onboardingService.getOnboardingState as jest.Mock).mockResolvedValue(state);
      const req = { user: { sub: 'u1' } } as unknown as Request;
      const res = mockRes();

      await onboardingController.getState(req, res, jest.fn());

      expect(onboardingService.getOnboardingState).toHaveBeenCalledWith('u1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: state }));
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = new Error('boom');
      (onboardingService.getOnboardingState as jest.Mock).mockRejectedValue(error);
      const req = { user: { sub: 'u1' } } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await onboardingController.getState(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('complete', () => {
    it('completes onboarding with the request body and returns the result', async () => {
      const result = { completed: true as const };
      (onboardingService.completeOnboarding as jest.Mock).mockResolvedValue(result);
      const body = { categories: ['Health'], reminderTime: '08:00:00' };
      const req = { user: { sub: 'u1' }, body } as unknown as Request;
      const res = mockRes();

      await onboardingController.complete(req, res, jest.fn());

      expect(onboardingService.completeOnboarding).toHaveBeenCalledWith('u1', body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: result, message: 'Onboarding complete' }),
      );
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = new Error('boom');
      (onboardingService.completeOnboarding as jest.Mock).mockRejectedValue(error);
      const req = { user: { sub: 'u1' }, body: { categories: [] } } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await onboardingController.complete(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
