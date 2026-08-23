'use strict';

const { randomUUID } = require('crypto');

const ROUTINE_IDS = [
  '33333333-3333-4333-8333-333333333301',
  '33333333-3333-4333-8333-333333333302',
  '33333333-3333-4333-8333-333333333303',
  '33333333-3333-4333-8333-333333333304',
  '33333333-3333-4333-8333-333333333305',
];

const STATUS_CYCLE = ['done', 'done', 'done', 'partial', 'done', 'missed', 'done'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = [];

    // 14 days of history per routine, so Stats/Calendar have real data to aggregate.
    for (const routineId of ROUTINE_IDS) {
      for (let dayOffset = 13; dayOffset >= 0; dayOffset -= 1) {
        const date = new Date(now);
        date.setDate(date.getDate() - dayOffset);
        const dateStr = date.toISOString().slice(0, 10);
        const status = STATUS_CYCLE[dayOffset % STATUS_CYCLE.length];

        const completedAt =
          status === 'done' || status === 'partial'
            ? new Date(
                `${dateStr}T${String(7 + (dayOffset % 12)).padStart(2, '0')}:${String(
                  (dayOffset * 7) % 60,
                ).padStart(2, '0')}:00`,
              )
            : null;

        rows.push({
          id: randomUUID(),
          routine_id: routineId,
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

    await queryInterface.bulkInsert('habit_logs', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('habit_logs', {
      routine_id: ROUTINE_IDS,
    });
  },
};
