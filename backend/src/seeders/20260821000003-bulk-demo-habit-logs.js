'use strict';

const { randomUUID } = require('crypto');
const { USERS } = require('./20260821000001-bulk-demo-users');
const routinesSeeder = require('./20260821000002-bulk-demo-routines');

const { TIERS, ROUTINES_PER_USER, routineId } = routinesSeeder;

// 35 days of trailing history per routine — comfortably covers the stats
// service's 30-day window (backend/src/services/stats.service.ts) and the
// current calendar month regardless of what day-of-month the seeder happens
// to run on (backend/src/services/calendar.service.ts).
const HISTORY_DAYS = 35;

// Three repeating status cycles, one per completion tier, so the 10 users
// span "crushing it" to "just getting started" instead of identical data —
// mirrors the single demo-user seeder's STATUS_CYCLE but with three flavors.
const CYCLES = {
  high: ['done', 'done', 'done', 'done', 'done', 'partial', 'done'],
  medium: ['done', 'done', 'partial', 'done', 'missed', 'done', 'skipped'],
  low: ['missed', 'done', 'skipped', 'missed', 'done', 'missed', 'partial'],
};

function statusForDay(tier, routineIndex, dayOffset) {
  const cycle = CYCLES[tier];
  return cycle[(dayOffset + routineIndex) % cycle.length];
}

function completedAtFor(dateStr, routineIndex, dayOffset) {
  const hour = String(7 + ((dayOffset + routineIndex) % 12)).padStart(2, '0');
  const minute = String((dayOffset * 7 + routineIndex * 3) % 60).padStart(2, '0');
  return new Date(`${dateStr}T${hour}:${minute}:00`);
}

function buildLogRows() {
  const now = new Date();
  const statusByRoutineId = new Map(routinesSeeder.buildRows().map((r) => [r.id, r.status]));
  const rows = [];

  USERS.forEach((user, userIndex) => {
    const tier = TIERS[userIndex];

    for (let routineIndex = 0; routineIndex < ROUTINES_PER_USER; routineIndex += 1) {
      const id = routineId(userIndex, routineIndex);
      // Paused routines keep a little history (so their detail page isn't
      // empty) but stop accumulating check-ins in the most recent week,
      // matching what "pausing" would look like for a real user.
      const isPaused = statusByRoutineId.get(id) === 'paused';
      const activeDays = isPaused ? HISTORY_DAYS - 7 : HISTORY_DAYS;

      for (let dayOffset = activeDays - 1; dayOffset >= 0; dayOffset -= 1) {
        const date = new Date(now);
        date.setDate(date.getDate() - dayOffset);
        const dateStr = date.toISOString().slice(0, 10);
        const status = statusForDay(tier, routineIndex, dayOffset);
        const completedAt =
          status === 'done' || status === 'partial'
            ? completedAtFor(dateStr, routineIndex, dayOffset)
            : null;

        rows.push({
          id: randomUUID(),
          routine_id: id,
          date: dateStr,
          status,
          value: null,
          note: null,
          completed_at: completedAt,
          created_at: now,
          updated_at: now,
        });
      }
    }
  });

  return rows;
}

function allSeededRoutineIds() {
  const ids = [];
  USERS.forEach((_user, userIndex) => {
    for (let routineIndex = 0; routineIndex < ROUTINES_PER_USER; routineIndex += 1) {
      ids.push(routineId(userIndex, routineIndex));
    }
  });
  return ids;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('habit_logs', buildLogRows());
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('habit_logs', { routine_id: allSeededRoutineIds() });
  },
};
