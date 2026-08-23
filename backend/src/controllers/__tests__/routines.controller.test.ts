jest.mock('../../services/routines.service');

import { Request } from 'express';
import * as routinesService from '../../services/routines.service';
import * as routinesController from '../routines.controller';
import { mockRes } from './testHelpers';

describe('routines.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('list passes query filters and the user id to the service', async () => {
    (routinesService.listRoutines as jest.Mock).mockResolvedValue([{ id: 'r1' }]);
    const req = {
      user: { sub: 'u1' },
      query: { status: 'active', category: 'Health' },
    } as unknown as Request;
    const res = mockRes();

    await routinesController.list(req, res, jest.fn());

    expect(routinesService.listRoutines).toHaveBeenCalledWith('u1', {
      status: 'active',
      category: 'Health',
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ id: 'r1' }] }));
  });

  it('getOne returns the routine by id', async () => {
    (routinesService.getRoutine as jest.Mock).mockResolvedValue({ id: 'r1' });
    const req = { user: { sub: 'u1' }, params: { id: 'r1' } } as unknown as Request;
    const res = mockRes();

    await routinesController.getOne(req, res, jest.fn());

    expect(routinesService.getRoutine).toHaveBeenCalledWith('u1', 'r1');
  });

  it('create returns 201 with the newly created routine', async () => {
    (routinesService.createRoutine as jest.Mock).mockResolvedValue({ id: 'new' });
    const req = { user: { sub: 'u1' }, body: { name: 'Read' } } as unknown as Request;
    const res = mockRes();

    await routinesController.create(req, res, jest.fn());

    expect(routinesService.createRoutine).toHaveBeenCalledWith('u1', req.body);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('update passes the id and body to the service', async () => {
    (routinesService.updateRoutine as jest.Mock).mockResolvedValue({ id: 'r1', name: 'Updated' });
    const req = {
      user: { sub: 'u1' },
      params: { id: 'r1' },
      body: { name: 'Updated' },
    } as unknown as Request;
    const res = mockRes();

    await routinesController.update(req, res, jest.fn());

    expect(routinesService.updateRoutine).toHaveBeenCalledWith('u1', 'r1', { name: 'Updated' });
  });

  it('remove returns 204 with no body', async () => {
    (routinesService.deleteRoutine as jest.Mock).mockResolvedValue(undefined);
    const req = { user: { sub: 'u1' }, params: { id: 'r1' } } as unknown as Request;
    const res = mockRes();

    await routinesController.remove(req, res, jest.fn());

    expect(routinesService.deleteRoutine).toHaveBeenCalledWith('u1', 'r1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('pause toggles the routine status', async () => {
    (routinesService.togglePause as jest.Mock).mockResolvedValue({ id: 'r1', status: 'paused' });
    const req = { user: { sub: 'u1' }, params: { id: 'r1' } } as unknown as Request;
    const res = mockRes();

    await routinesController.pause(req, res, jest.fn());

    expect(routinesService.togglePause).toHaveBeenCalledWith('u1', 'r1');
  });

  it('checkIn forwards the body to the service', async () => {
    (routinesService.checkIn as jest.Mock).mockResolvedValue({ routine: {}, log: {} });
    const req = {
      user: { sub: 'u1' },
      params: { id: 'r1' },
      body: { status: 'done' },
    } as unknown as Request;
    const res = mockRes();

    await routinesController.checkIn(req, res, jest.fn());

    expect(routinesService.checkIn).toHaveBeenCalledWith('u1', 'r1', { status: 'done' });
  });

  it('forwards service errors to next instead of throwing', async () => {
    const error = new Error('boom');
    (routinesService.getRoutine as jest.Mock).mockRejectedValue(error);
    const req = { user: { sub: 'u1' }, params: { id: 'r1' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    await routinesController.getOne(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
