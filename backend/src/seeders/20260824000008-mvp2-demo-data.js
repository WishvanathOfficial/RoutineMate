'use strict';

const { randomUUID } = require('crypto');
const { QueryTypes } = require('sequelize');
const { DEMO_USER_ID } = require('./20260820000001-demo-user');
const { USERS } = require('./20260821000001-bulk-demo-users');

// Populates every MVP-2 table (goals, journal_entries, notifications,
// user_xp, user_achievements, onboarding_states) for all 11 demo accounts,
// so logging into any of them shows the new Goals/Achievements/Journal/
// Notification Center screens fully populated — same goal as the original
// MVP-1 bulk seeders (see 20260821000001-bulk-demo-users.js).
//
// Unlike the MVP-1 seeders, this one queries the routines/habit_logs tables
// those seeders already inserted (via raw SQL — seeders run standalone, no
// access to the compiled service layer) instead of re-deriving stats from
// hardcoded tier logic, so the numbers here always match what's actually in
// the DB. The achievement-unlock thresholds mirror
// backend/src/services/achievements.service.ts's rule engine; keep the two
// in sync by hand if those thresholds ever change.

const ALL_USER_IDS = [DEMO_USER_ID, ...USERS.map((u) => u.id)];
const XP_PER_ACHIEVEMENT = 50;
const XP_PER_CHECKIN = 10; // mirrors achievements.service.ts's XP_PER_CHECKIN
const CONSISTENCY_MIN_LOGGED = 20; // mirrors CONSISTENCY_MIN_LOGGED
const CONSISTENCY_MIN_RATE = 0.9; // mirrors CONSISTENCY_MIN_RATE

async function statsForUser(sequelize, userId) {
  const [agg] = await sequelize.query(
    `SELECT COALESCE(MAX(current_streak), 0) AS maxStreak, COUNT(*) AS routineCount
     FROM routines WHERE user_id = :userId`,
    { replacements: { userId }, type: QueryTypes.SELECT },
  );
  const [doneAgg] = await sequelize.query(
    `SELECT COUNT(*) AS doneCount FROM habit_logs hl
     INNER JOIN routines r ON r.id = hl.routine_id
     WHERE r.user_id = :userId AND hl.status = 'done'`,
    { replacements: { userId }, type: QueryTypes.SELECT },
  );
  const [last28Agg] = await sequelize.query(
    `SELECT COUNT(*) AS loggedCount,
            SUM(CASE WHEN hl.status = 'done' THEN 1 ELSE 0 END) AS doneCount
     FROM habit_logs hl
     INNER JOIN routines r ON r.id = hl.routine_id
     WHERE r.user_id = :userId AND hl.date >= DATE_SUB(CURDATE(), INTERVAL 27 DAY)`,
    { replacements: { userId }, type: QueryTypes.SELECT },
  );
  const routines = await sequelize.query(
    `SELECT id, name, emoji, category FROM routines WHERE user_id = :userId ORDER BY created_at ASC`,
    { replacements: { userId }, type: QueryTypes.SELECT },
  );
  return {
    maxStreak: Number(agg.maxStreak),
    routineCount: Number(agg.routineCount),
    doneCount: Number(doneAgg.doneCount),
    last28LoggedCount: Number(last28Agg.loggedCount),
    last28DoneCount: Number(last28Agg.doneCount ?? 0),
    routines,
  };
}

// Mirrors achievements.service.ts's evaluateAndUnlockAchievements() rules,
// in catalog (sort_order) sequence — 'perfect-week' has no auto-rule there
// either, so it's intentionally never seeded as unlocked.
function unlockedAchievementIds(stats) {
  const ids = [];
  if (stats.routineCount >= 1) ids.push('first-habit');
  if (stats.maxStreak >= 7) ids.push('streak-7');
  if (stats.doneCount >= 50) ids.push('checkins-50');
  if (stats.maxStreak >= 30) ids.push('streak-30');
  if (stats.doneCount >= 100) ids.push('checkins-100');
  if (stats.maxStreak >= 100) ids.push('streak-100');
  if (stats.maxStreak >= 365) ids.push('streak-365');
  if (stats.doneCount >= 500) ids.push('checkins-500');
  if (
    stats.last28LoggedCount >= CONSISTENCY_MIN_LOGGED &&
    stats.last28DoneCount / stats.last28LoggedCount >= CONSISTENCY_MIN_RATE
  ) {
    ids.push('consistency-4wk');
  }
  return ids;
}

function daysAgo(now, n) {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
}

const JOURNAL_NOTES = [
  'Solid day overall — stayed on track with most of my habits.',
  'A bit of a rough one, but showed up anyway.',
  'Great momentum today, feeling good about the week.',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const now = new Date();

    const achievementRows = await sequelize.query('SELECT id, title FROM achievements', {
      type: QueryTypes.SELECT,
    });
    const titleByAchievementId = new Map(achievementRows.map((a) => [a.id, a.title]));

    const goalRows = [];
    const journalRows = [];
    const notificationRows = [];
    const userXpRows = [];
    const userAchievementRows = [];
    const onboardingRows = [];

    for (let userIndex = 0; userIndex < ALL_USER_IDS.length; userIndex += 1) {
      const userId = ALL_USER_IDS[userIndex];
      const stats = await statsForUser(sequelize, userId);
      const unlockedIds = unlockedAchievementIds(stats);
      const [primaryRoutine, secondaryRoutine] = stats.routines;

      // --- user_xp --- (badge XP + one XP_PER_CHECKIN per 'done' habit_log,
      // mirroring achievements.service.ts's awardCheckInXp())
      userXpRows.push({
        id: randomUUID(),
        user_id: userId,
        total_points: unlockedIds.length * XP_PER_ACHIEVEMENT + stats.doneCount * XP_PER_CHECKIN,
        created_at: now,
        updated_at: now,
      });

      // --- user_achievements (unlocked_at staggered so "most recent" is meaningful) ---
      unlockedIds.forEach((achievementId, catalogIndex) => {
        userAchievementRows.push({
          id: randomUUID(),
          user_id: userId,
          achievement_id: achievementId,
          unlocked_at: daysAgo(now, (unlockedIds.length - catalogIndex) * 3),
          created_at: now,
          updated_at: now,
        });
      });

      // --- notifications: one per unlocked achievement, plus the same
      // reminder/streak-risk/digest trio the old frontend mock shipped. ---
      unlockedIds.forEach((achievementId, catalogIndex) => {
        notificationRows.push({
          id: randomUUID(),
          user_id: userId,
          type: 'achievement',
          message: `New badge unlocked: ${titleByAchievementId.get(achievementId) ?? achievementId}!`,
          read: catalogIndex < unlockedIds.length - 1, // only the latest stays unread
          snoozeable: false,
          created_at: daysAgo(now, (unlockedIds.length - catalogIndex) * 3),
          updated_at: now,
        });
      });
      if (primaryRoutine) {
        notificationRows.push({
          id: randomUUID(),
          user_id: userId,
          type: 'reminder',
          message: `Reminder: ${primaryRoutine.name} is coming up`,
          read: false,
          snoozeable: true,
          created_at: new Date(now.getTime() - 60 * 60 * 1000),
          updated_at: now,
        });
        notificationRows.push({
          id: randomUUID(),
          user_id: userId,
          type: 'streak_risk',
          message: `Your ${primaryRoutine.name} streak is at risk — complete it today to keep it alive.`,
          read: false,
          snoozeable: false,
          created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          updated_at: now,
        });
      }
      notificationRows.push({
        id: randomUUID(),
        user_id: userId,
        type: 'digest',
        message: '3 habits left today',
        read: true,
        snoozeable: false,
        created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        updated_at: now,
      });

      // --- goals: linked to the user's own real routines so
      // goals.service.ts's live progress computation has something to
      // chew on immediately. ---
      if (primaryRoutine) {
        goalRows.push({
          id: randomUUID(),
          user_id: userId,
          title: `Master ${primaryRoutine.name}`,
          emoji: primaryRoutine.emoji,
          target_date: daysAgo(now, -16).toISOString().slice(0, 10), // 16 days out
          status: 'active',
          linked_routine_ids: JSON.stringify([primaryRoutine.id]),
          milestones: JSON.stringify([]),
          completed_at: null,
          created_at: daysAgo(now, 14),
          updated_at: now,
        });
      }
      if (secondaryRoutine) {
        goalRows.push({
          id: randomUUID(),
          user_id: userId,
          title: `Consistency Challenge: ${secondaryRoutine.name}`,
          emoji: secondaryRoutine.emoji,
          target_date: daysAgo(now, -3).toISOString().slice(0, 10), // 3 days out
          status: 'active',
          linked_routine_ids: JSON.stringify([secondaryRoutine.id]),
          milestones: JSON.stringify([]),
          completed_at: null,
          created_at: daysAgo(now, 40),
          updated_at: now,
        });
      }

      // A milestone-based goal, not tied to any routine — showcases §3.2's
      // "manual milestone checkpoints for goals that aren't purely
      // check-in based" example verbatim. Progress varies per demo user so
      // the milestone checklist/progress bar don't all look identical.
      const run5kMilestones = [
        { id: randomUUID(), title: 'Run 1K without stopping', done: true },
        { id: randomUUID(), title: 'Run 3K without stopping', done: userIndex % 2 === 0 },
        { id: randomUUID(), title: 'Run 5K without stopping', done: false },
      ];
      goalRows.push({
        id: randomUUID(),
        user_id: userId,
        title: 'Run a 5K',
        emoji: '🏃',
        target_date: daysAgo(now, -30).toISOString().slice(0, 10), // 30 days out
        status: 'active',
        linked_routine_ids: JSON.stringify([]),
        milestones: JSON.stringify(run5kMilestones),
        completed_at: null,
        created_at: daysAgo(now, 10),
        updated_at: now,
      });

      // --- journal_entries: last 3 days, mood varies per user/day. ---
      [2, 1, 0].forEach((dayOffset, i) => {
        const mood = ((userIndex + dayOffset) % 5) + 1;
        journalRows.push({
          id: randomUUID(),
          user_id: userId,
          date: daysAgo(now, dayOffset).toISOString().slice(0, 10),
          mood,
          note: JOURNAL_NOTES[(userIndex + i) % JOURNAL_NOTES.length],
          created_at: daysAgo(now, dayOffset),
          updated_at: now,
        });
      });

      // --- onboarding_states: demo accounts skip the wizard on login. ---
      const categories = [...new Set(stats.routines.map((r) => r.category))].slice(0, 3);
      onboardingRows.push({
        id: randomUUID(),
        user_id: userId,
        completed: true,
        completed_at: daysAgo(now, 30),
        categories: JSON.stringify(categories.length > 0 ? categories : ['Health']),
        reminder_time: '08:00:00',
        created_at: daysAgo(now, 30),
        updated_at: now,
      });
    }

    await queryInterface.bulkInsert('user_xp', userXpRows);
    await queryInterface.bulkInsert('user_achievements', userAchievementRows);
    await queryInterface.bulkInsert('notifications', notificationRows);
    await queryInterface.bulkInsert('goals', goalRows);
    await queryInterface.bulkInsert('journal_entries', journalRows);
    await queryInterface.bulkInsert('onboarding_states', onboardingRows);

    // The user_xp totals above already account for every existing 'done'
    // habit_log via XP_PER_CHECKIN — flag those rows as already paid out so
    // a future toggle-off/toggle-on in the running app doesn't double-award
    // XP for a day that was seeded as already complete.
    await sequelize.query("UPDATE habit_logs SET xp_awarded = true WHERE status = 'done'");
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('onboarding_states', { user_id: ALL_USER_IDS });
    await queryInterface.bulkDelete('journal_entries', { user_id: ALL_USER_IDS });
    await queryInterface.bulkDelete('goals', { user_id: ALL_USER_IDS });
    await queryInterface.bulkDelete('notifications', { user_id: ALL_USER_IDS });
    await queryInterface.bulkDelete('user_achievements', { user_id: ALL_USER_IDS });
    await queryInterface.bulkDelete('user_xp', { user_id: ALL_USER_IDS });
  },
};
