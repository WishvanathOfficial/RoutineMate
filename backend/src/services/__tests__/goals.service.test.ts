jest.mock('../../models', () => ({
  Goal: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Routine: { findAll: jest.fn() },
}));

import { Goal, Routine } from '../../models';
import * as goalsService from '../goals.service';

function makeGoal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'g1',
    userId: 'u1',
    title: 'Read more',
    emoji: '🎯',
    targetDate: '2026-09-19',
    status: 'active',
    linkedRoutineIds: [],
    milestones: [] as { id: string; title: string; done: boolean }[],
    completedAt: null,
    createdAt: new Date('2026-08-20T00:00:00Z'),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('goals.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-24T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('listGoals', () => {
    it('returns an empty array when the user has no goals', async () => {
      (Goal.findAll as jest.Mock).mockResolvedValue([]);

      const goals = await goalsService.listGoals('u1');

      expect(goals).toEqual([]);
      expect(Goal.findAll).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        order: [['createdAt', 'DESC']],
      });
      expect(Routine.findAll).not.toHaveBeenCalled();
    });

    it('reports 0% progress for a goal with no linked routines', async () => {
      const goal = makeGoal({ linkedRoutineIds: [] });
      (Goal.findAll as jest.Mock).mockResolvedValue([goal]);

      const goals = await goalsService.listGoals('u1');

      expect(goals).toHaveLength(1);
      expect(goals[0].progress).toBe(0);
      expect(goal.save).not.toHaveBeenCalled();
      expect(Routine.findAll).not.toHaveBeenCalled();
    });

    it('reports 0% progress when linked routine ids no longer resolve to any routine', async () => {
      const goal = makeGoal({ linkedRoutineIds: ['r1'] });
      (Goal.findAll as jest.Mock).mockResolvedValue([goal]);
      (Routine.findAll as jest.Mock).mockResolvedValue([]);

      const goals = await goalsService.listGoals('u1');

      expect(goals[0].progress).toBe(0);
      expect(goal.save).not.toHaveBeenCalled();
    });

    it('computes partial progress from the average streak ratio across linked routines', async () => {
      // window: createdAt 2026-08-20 -> targetDate 2026-09-19 = 30 days
      const goal = makeGoal({
        createdAt: new Date('2026-08-20T00:00:00Z'),
        targetDate: '2026-09-19',
        linkedRoutineIds: ['r1', 'r2'],
      });
      (Goal.findAll as jest.Mock).mockResolvedValue([goal]);
      (Routine.findAll as jest.Mock).mockResolvedValue([
        { id: 'r1', currentStreak: 3 }, // 3/30 = 0.1
        { id: 'r2', currentStreak: 6 }, // 6/30 = 0.2
      ]);

      const goals = await goalsService.listGoals('u1');

      // average(0.1, 0.2) = 0.15 -> 15%
      expect(goals[0].progress).toBe(15);
      expect(goal.save).not.toHaveBeenCalled();
      expect(goal.status).toBe('active');
    });

    it('caps each routine ratio at 1 and auto-completes the goal once average progress reaches 100%', async () => {
      const goal = makeGoal({
        createdAt: new Date('2026-08-20T00:00:00Z'),
        targetDate: '2026-08-21', // windowDays = 1
        linkedRoutineIds: ['r1', 'r2'],
        status: 'active',
      });
      (Goal.findAll as jest.Mock).mockResolvedValue([goal]);
      (Routine.findAll as jest.Mock).mockResolvedValue([
        { id: 'r1', currentStreak: 50 }, // ratio capped at 1
        { id: 'r2', currentStreak: 10 }, // ratio capped at 1
      ]);

      const goals = await goalsService.listGoals('u1');

      expect(goals[0].progress).toBe(100);
      expect(goal.status).toBe('completed');
      expect(goal.completedAt).toEqual(new Date('2026-08-24T12:00:00Z'));
      expect(goal.save).toHaveBeenCalledTimes(1);
      expect(goals[0].status).toBe('completed');
    });

    it('returns 100% for a goal already marked completed without touching Routine or save', async () => {
      const goal = makeGoal({ status: 'completed', linkedRoutineIds: ['r1'] });
      (Goal.findAll as jest.Mock).mockResolvedValue([goal]);

      const goals = await goalsService.listGoals('u1');

      expect(goals[0].progress).toBe(100);
      expect(Routine.findAll).not.toHaveBeenCalled();
      expect(goal.save).not.toHaveBeenCalled();
    });

    it('does not re-save a goal already at/above 100% progress but still active is only saved once, and leaves completedAt as ISO string in the dto', async () => {
      const goal = makeGoal({
        createdAt: new Date('2026-08-20T00:00:00Z'),
        targetDate: '2026-08-21',
        linkedRoutineIds: ['r1'],
        status: 'active',
      });
      (Goal.findAll as jest.Mock).mockResolvedValue([goal]);
      (Routine.findAll as jest.Mock).mockResolvedValue([{ id: 'r1', currentStreak: 5 }]);

      const goals = await goalsService.listGoals('u1');

      expect(goals[0].completedAt).toBe(new Date('2026-08-24T12:00:00Z').toISOString());
    });

    it('maps multiple goals to dtos preserving order returned by the model', async () => {
      const goalA = makeGoal({ id: 'gA', linkedRoutineIds: [] });
      const goalB = makeGoal({ id: 'gB', status: 'completed', linkedRoutineIds: [] });
      (Goal.findAll as jest.Mock).mockResolvedValue([goalA, goalB]);

      const goals = await goalsService.listGoals('u1');

      expect(goals.map((g) => g.id)).toEqual(['gA', 'gB']);
      expect(goals[0].progress).toBe(0);
      expect(goals[1].progress).toBe(100);
    });

    it('serializes null completedAt as null in the dto', async () => {
      const goal = makeGoal({ completedAt: null, linkedRoutineIds: [] });
      (Goal.findAll as jest.Mock).mockResolvedValue([goal]);

      const goals = await goalsService.listGoals('u1');

      expect(goals[0].completedAt).toBeNull();
    });
  });

  describe('createGoal', () => {
    it('creates a goal with no linked routines when none are provided', async () => {
      (Goal.create as jest.Mock).mockResolvedValue(makeGoal({ id: 'gNew', linkedRoutineIds: [] }));

      const dto = await goalsService.createGoal('u1', {
        title: 'Read more',
        targetDate: '2026-09-19',
        linkedRoutineIds: [],
        milestones: [],
      });

      expect(Routine.findAll).not.toHaveBeenCalled();
      expect(Goal.create).toHaveBeenCalledWith({
        userId: 'u1',
        title: 'Read more',
        targetDate: '2026-09-19',
        linkedRoutineIds: [],
        milestones: [],
      });
      expect(dto.progress).toBe(0);
      expect(dto.id).toBe('gNew');
    });

    it('only persists linkedRoutineIds that the user actually owns', async () => {
      (Routine.findAll as jest.Mock).mockResolvedValue([{ id: 'r1' }]);
      (Goal.create as jest.Mock).mockResolvedValue(
        makeGoal({ id: 'gNew', linkedRoutineIds: ['r1'] }),
      );

      await goalsService.createGoal('u1', {
        title: 'Read more',
        targetDate: '2026-09-19',
        linkedRoutineIds: ['r1', 'r2-not-owned'],
        milestones: [],
      });

      expect(Routine.findAll).toHaveBeenCalledWith({
        where: { id: ['r1', 'r2-not-owned'], userId: 'u1' },
        attributes: ['id'],
      });
      expect(Goal.create).toHaveBeenCalledWith({
        userId: 'u1',
        title: 'Read more',
        targetDate: '2026-09-19',
        linkedRoutineIds: ['r1'],
        milestones: [],
      });
    });

    it('drops all linkedRoutineIds when none of them resolve to owned routines', async () => {
      (Routine.findAll as jest.Mock).mockResolvedValue([]);
      (Goal.create as jest.Mock).mockResolvedValue(makeGoal({ id: 'gNew', linkedRoutineIds: [] }));

      const dto = await goalsService.createGoal('u1', {
        title: 'Read more',
        targetDate: '2026-09-19',
        linkedRoutineIds: ['not-mine'],
        milestones: [],
      });

      expect(Goal.create).toHaveBeenCalledWith(expect.objectContaining({ linkedRoutineIds: [] }));
      expect(dto.linkedRoutineIds).toEqual([]);
      expect(dto.progress).toBe(0);
    });

    it('assigns a server-side id and done:false to each supplied milestone title', async () => {
      (Goal.create as jest.Mock).mockImplementation((attrs) =>
        Promise.resolve(makeGoal({ id: 'gNew', ...attrs })),
      );

      const dto = await goalsService.createGoal('u1', {
        title: 'Run a 5K',
        targetDate: '2026-10-01',
        linkedRoutineIds: [],
        milestones: [{ title: 'Run 1K' }, { title: 'Run 3K' }],
      });

      expect(dto.milestones).toHaveLength(2);
      expect(dto.milestones[0]).toMatchObject({ title: 'Run 1K', done: false });
      expect(dto.milestones[1]).toMatchObject({ title: 'Run 3K', done: false });
      expect(dto.milestones[0].id).toBeTruthy();
      expect(dto.milestones[0].id).not.toBe(dto.milestones[1].id);
    });
  });

  describe('milestone-based progress (listGoals)', () => {
    it('computes progress as the percentage of milestones marked done, ignoring linked routines', async () => {
      const goal = makeGoal({
        linkedRoutineIds: ['r1'], // present, but should be ignored — milestones win
        milestones: [
          { id: 'm1', title: 'Run 1K', done: true },
          { id: 'm2', title: 'Run 3K', done: true },
          { id: 'm3', title: 'Run 5K', done: false },
        ],
      });
      (Goal.findAll as jest.Mock).mockResolvedValue([goal]);

      const goals = await goalsService.listGoals('u1');

      expect(goals[0].progress).toBe(67); // 2/3 rounded
      expect(Routine.findAll).not.toHaveBeenCalled();
    });

    it('auto-completes a milestone-based goal once every milestone is done', async () => {
      const goal = makeGoal({
        milestones: [
          { id: 'm1', title: 'Run 1K', done: true },
          { id: 'm2', title: 'Run 3K', done: true },
        ],
      });
      (Goal.findAll as jest.Mock).mockResolvedValue([goal]);

      const goals = await goalsService.listGoals('u1');

      expect(goals[0].progress).toBe(100);
      expect(goal.status).toBe('completed');
      expect(goal.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('toggleMilestone', () => {
    it('throws not found when the goal is not owned by the user', async () => {
      (Goal.findOne as jest.Mock).mockResolvedValue(null);

      await expect(goalsService.toggleMilestone('u1', 'missing', 'm1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws not found when the milestone id does not exist on the goal', async () => {
      const goal = makeGoal({ milestones: [{ id: 'm1', title: 'Run 1K', done: false }] });
      (Goal.findOne as jest.Mock).mockResolvedValue(goal);

      await expect(goalsService.toggleMilestone('u1', 'g1', 'not-a-real-id')).rejects.toMatchObject(
        { statusCode: 404 },
      );
    });

    it('flips a milestone from not-done to done and saves', async () => {
      const goal = makeGoal({
        milestones: [
          { id: 'm1', title: 'Run 1K', done: false },
          { id: 'm2', title: 'Run 3K', done: false },
        ],
      });
      (Goal.findOne as jest.Mock).mockResolvedValue(goal);

      const dto = await goalsService.toggleMilestone('u1', 'g1', 'm1');

      expect(dto.milestones).toEqual([
        { id: 'm1', title: 'Run 1K', done: true },
        { id: 'm2', title: 'Run 3K', done: false },
      ]);
      expect(dto.progress).toBe(50);
      expect(goal.save).toHaveBeenCalledTimes(1);
    });

    it('flips a milestone back from done to not-done', async () => {
      const goal = makeGoal({
        milestones: [{ id: 'm1', title: 'Run 1K', done: true }],
        status: 'active',
      });
      (Goal.findOne as jest.Mock).mockResolvedValue(goal);

      const dto = await goalsService.toggleMilestone('u1', 'g1', 'm1');

      expect(dto.milestones).toEqual([{ id: 'm1', title: 'Run 1K', done: false }]);
      expect(dto.progress).toBe(0);
    });

    it('auto-completes the goal when the toggle brings every milestone to done', async () => {
      const goal = makeGoal({
        milestones: [
          { id: 'm1', title: 'Run 1K', done: true },
          { id: 'm2', title: 'Run 3K', done: false },
        ],
      });
      (Goal.findOne as jest.Mock).mockResolvedValue(goal);

      const dto = await goalsService.toggleMilestone('u1', 'g1', 'm2');

      expect(dto.progress).toBe(100);
      expect(dto.status).toBe('completed');
      expect(goal.completedAt).toEqual(new Date('2026-08-24T12:00:00Z'));
    });
  });
});
