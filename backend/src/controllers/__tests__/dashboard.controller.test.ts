jest.mock('../../services/dashboard.service');
jest.mock('../../models', () => ({ User: { findByPk: jest.fn() } }));

import { Request } from 'express';
import { User } from '../../models';
import * as dashboardService from '../../services/dashboard.service';
import * as dashboardController from '../dashboard.controller';
import { mockRes } from './testHelpers';

describe('dashboard.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGreeting', () => {
    it('forwards not-found to next when the user no longer exists', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);
      const req = { user: { sub: 'u1', email: 'a@a.com' } } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await dashboardController.getGreeting(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it("returns the greeting built from the authenticated user's name", async () => {
      (User.findByPk as jest.Mock).mockResolvedValue({ name: 'Wishvanath' });
      (dashboardService.getGreeting as jest.Mock).mockReturnValue({
        name: 'Wishvanath',
        quote: 'Go!',
      });
      const req = { user: { sub: 'u1', email: 'a@a.com' } } as unknown as Request;
      const res = mockRes();

      await dashboardController.getGreeting(req, res, jest.fn());

      expect(dashboardService.getGreeting).toHaveBeenCalledWith('Wishvanath');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: 'Wishvanath', quote: 'Go!' } }),
      );
    });
  });

  describe('getOverview', () => {
    it('returns the dashboard overview for the authenticated user', async () => {
      const overview = { activeRoutineCount: 2 };
      (dashboardService.getDashboardOverview as jest.Mock).mockResolvedValue(overview);
      const req = { user: { sub: 'u1' } } as unknown as Request;
      const res = mockRes();

      await dashboardController.getOverview(req, res, jest.fn());

      expect(dashboardService.getDashboardOverview).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: overview }));
    });
  });
});
