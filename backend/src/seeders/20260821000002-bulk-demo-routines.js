'use strict';

const { USERS } = require('./20260821000001-bulk-demo-users');

// Pool of 10 templates spanning all 5 categories and all 4 frequency types
// the frontend's routines.mapper.ts knows how to translate (daily, weekdays,
// specific_days, interval) — see docs/RoutineMate-Frontend-Backend-Integration-Plan.md §2.3.
const TEMPLATES = [
  { name: 'Drink Water', emoji: '💧', category: 'Health', frequencyType: 'daily', frequencyConfig: null, reminderTime: '08:00:00', targetValue: 8, targetUnit: 'glasses' },
  { name: 'Morning Meditation', emoji: '🧘', category: 'Mindfulness', frequencyType: 'daily', frequencyConfig: null, reminderTime: '06:30:00', targetValue: null, targetUnit: null },
  { name: 'Read 20 Pages', emoji: '📚', category: 'Learning', frequencyType: 'daily', frequencyConfig: null, reminderTime: '21:00:00', targetValue: 20, targetUnit: 'pages' },
  { name: 'Exercise', emoji: '🏃', category: 'Health', frequencyType: 'specific_days', frequencyConfig: { days: [1, 3, 5] }, reminderTime: '06:00:00', targetValue: null, targetUnit: null },
  { name: 'Sleep by 11 PM', emoji: '😴', category: 'Wellness', frequencyType: 'daily', frequencyConfig: null, reminderTime: '23:00:00', targetValue: null, targetUnit: null },
  { name: 'Quit Smoking', emoji: '🚭', category: 'Health', frequencyType: 'daily', frequencyConfig: null, reminderTime: '09:00:00', targetValue: null, targetUnit: null },
  { name: 'Journal', emoji: '✍️', category: 'Mindfulness', frequencyType: 'daily', frequencyConfig: null, reminderTime: '21:30:00', targetValue: null, targetUnit: null },
  { name: 'Eat Healthy', emoji: '🥗', category: 'Wellness', frequencyType: 'daily', frequencyConfig: null, reminderTime: '12:00:00', targetValue: null, targetUnit: null },
  { name: 'Plan Tomorrow', emoji: '🗒️', category: 'Productivity', frequencyType: 'weekdays', frequencyConfig: null, reminderTime: '20:00:00', targetValue: null, targetUnit: null },
  { name: 'Learn Spanish', emoji: '🗣️', category: 'Learning', frequencyType: 'interval', frequencyConfig: { everyNDays: 2 }, reminderTime: '19:00:00', targetValue: 15, targetUnit: 'minutes' },
];

const ROUTINES_PER_USER = 5;

// Rotates the 5-routine slice across the 10 templates so every user gets a
// different mix, and every template/category/frequency-type appears
// somewhere in the seeded data.
function templatesForUser(userIndex) {
  const offset = (userIndex * 3) % TEMPLATES.length;
  return Array.from({ length: ROUTINES_PER_USER }, (_, i) => TEMPLATES[(offset + i) % TEMPLATES.length]);
}

// Three completion tiers (see the habit-logs seeder that follows) drive both
// the historical logs and these pre-computed streak columns, so Stats/
// Routines show a realistic spread from "crushing it" to "just started"
// across the 10 users instead of identical numbers everywhere.
const TIERS = ['high', 'medium', 'low', 'high', 'medium', 'low', 'high', 'medium', 'low', 'high'];

function streaksFor(tier, routineIndex) {
  const base = { high: 14, medium: 6, low: 1 }[tier];
  const current = base + routineIndex;
  const longest = current + { high: 8, medium: 5, low: 3 }[tier];
  return { current, longest };
}

function routineId(userIndex, routineIndex) {
  const u = String(userIndex + 1).padStart(2, '0');
  const r = String(routineIndex + 1).padStart(2, '0');
  return `66666666-6666-4666-8666-${u}${r}00000000`;
}

function buildRows() {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 34);
  const startDateStr = startDate.toISOString().slice(0, 10);

  const rows = [];
  USERS.forEach((user, userIndex) => {
    const templates = templatesForUser(userIndex);
    const tier = TIERS[userIndex];

    templates.forEach((template, routineIndex) => {
      const { current, longest } = streaksFor(tier, routineIndex);
      // The last routine of every third user is paused, so "Paused" filters
      // and the pause/resume toggle have something to show across accounts.
      const status = routineIndex === ROUTINES_PER_USER - 1 && userIndex % 3 === 0 ? 'paused' : 'active';

      rows.push({
        id: routineId(userIndex, routineIndex),
        user_id: user.id,
        name: template.name,
        emoji: template.emoji,
        category: template.category,
        frequency_type: template.frequencyType,
        frequency_config: template.frequencyConfig ? JSON.stringify(template.frequencyConfig) : null,
        reminder_type: 'time',
        reminder_time: template.reminderTime,
        reminder_location: null,
        target_value: template.targetValue,
        target_unit: template.targetUnit,
        status,
        current_streak: status === 'paused' ? 0 : current,
        longest_streak: longest,
        start_date: startDateStr,
        end_date: null,
        created_at: now,
        updated_at: now,
      });
    });
  });

  return rows;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('routines', buildRows());
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('routines', { id: buildRows().map((r) => r.id) });
  },
};

module.exports.ROUTINE_IDS = buildRows().map((r) => r.id);
module.exports.buildRows = buildRows;
module.exports.TIERS = TIERS;
module.exports.ROUTINES_PER_USER = ROUTINES_PER_USER;
module.exports.routineId = routineId;
