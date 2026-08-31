jest.mock('../../services/goals.service');

import { Request } from 'express';
import * as goalsService from '../../services/goals.service';
import * as goalsController from '../goals.controller';
import { mockRes } from './testHelpers';

describe('goals.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns the goals for the authenticated user', async () => {
      const goals = [{ id: 'g1', title: 'Read more', progress: 50 }];
      (goalsService.listGoals as jest.Mock).mockResolvedValue(goals);
      const req = { user: { sub: 'u1' } } as unknown as Request;
      const res = mockRes();

      await goalsController.list(req, res, jest.fn());

      expect(goalsService.listGoals).toHaveBeenCalledWith('u1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: goals }),
      );
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = new Error('boom');
      (goalsService.listGoals as jest.Mock).mockRejectedValue(error);
      const req = { user: { sub: 'u1' } } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await goalsController.list(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('creates a goal from the request body for the authenticated user', async () => {
      const created = { id: 'gNew', title: 'Read more', progress: 0 };
      (goalsService.createGoal as jest.Mock).mockResolvedValue(created);
      const body = { title: 'Read more', targetDate: '2026-09-19', linkedRoutineIds: [] };
      const req = { user: { sub: 'u1' }, body } as unknown as Request;
      const res = mockRes();

      await goalsController.create(req, res, jest.fn());

      expect(goalsService.createGoal).toHaveBeenCalledWith('u1', body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: created, message: 'Goal created' }),
      );
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = new Error('boom');
      (goalsService.createGoal as jest.Mock).mockRejectedValue(error);
      const req = {
        user: { sub: 'u1' },
        body: { title: 'Read more', targetDate: '2026-09-19', linkedRoutineIds: [] },
      } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await goalsController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('toggleMilestone', () => {
    it('toggles the milestone for the authenticated user', async () => {
      const updated = { id: 'g1', progress: 50, milestones: [] };
      (goalsService.toggleMilestone as jest.Mock).mockResolvedValue(updated);
      const req = {
        user: { sub: 'u1' },
        params: { id: 'g1', milestoneId: 'm1' },
      } as unknown as Request;
      const res = mockRes();

      await goalsController.toggleMilestone(req, res, jest.fn());

      expect(goalsService.toggleMilestone).toHaveBeenCalledWith('u1', 'g1', 'm1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: updated }),
      );
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = new Error('boom');
      (goalsService.toggleMilestone as jest.Mock).mockRejectedValue(error);
      const req = {
        user: { sub: 'u1' },
        params: { id: 'g1', milestoneId: 'm1' },
      } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await goalsController.toggleMilestone(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
