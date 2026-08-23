'use strict';

const DEMO_USER_ID = '11111111-1111-4111-8111-111111111111';

const ROUTINES = [
  {
    id: '33333333-3333-4333-8333-333333333301',
    name: 'Drink Water',
    emoji: '💧',
    category: 'Health',
    frequency_type: 'daily',
    target_value: 8,
    target_unit: 'glasses',
    current_streak: 5,
    longest_streak: 12,
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
    name: 'Morning Meditation',
    emoji: '🧘',
    category: 'Mindfulness',
    frequency_type: 'daily',
    target_value: null,
    target_unit: null,
    current_streak: 8,
    longest_streak: 21,
  },
  {
    id: '33333333-3333-4333-8333-333333333303',
    name: 'Read 20 Pages',
    emoji: '📚',
    category: 'Learning',
    frequency_type: 'weekdays',
    target_value: 20,
    target_unit: 'pages',
    current_streak: 3,
    longest_streak: 9,
  },
  {
    id: '33333333-3333-4333-8333-333333333304',
    name: 'Evening Walk',
    emoji: '🚶',
    category: 'Wellness',
    frequency_type: 'daily',
    target_value: null,
    target_unit: null,
    current_streak: 2,
    longest_streak: 15,
  },
  {
    id: '33333333-3333-4333-8333-333333333305',
    name: 'Plan Tomorrow',
    emoji: '🗒️',
    category: 'Productivity',
    frequency_type: 'weekdays',
    target_value: null,
    target_unit: null,
    current_streak: 4,
    longest_streak: 6,
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().slice(0, 10);

    await queryInterface.bulkInsert(
      'routines',
      ROUTINES.map((r) => ({
        id: r.id,
        user_id: DEMO_USER_ID,
        name: r.name,
        emoji: r.emoji,
        category: r.category,
        frequency_type: r.frequency_type,
        frequency_config: null,
        reminder_type: 'time',
        reminder_time: '08:00:00',
        reminder_location: null,
        target_value: r.target_value,
        target_unit: r.target_unit,
        status: 'active',
        current_streak: r.current_streak,
        longest_streak: r.longest_streak,
        start_date: startDateStr,
        end_date: null,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('routines', {
      id: ROUTINES.map((r) => r.id),
    });
  },
};

module.exports.ROUTINE_IDS = ROUTINES.map((r) => r.id);
