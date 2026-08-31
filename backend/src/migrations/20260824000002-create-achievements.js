'use strict';

// Static badge catalog — see docs/RoutineMate-MVP2-Scope.md §3.4 and the
// frontend mock it replaces (src/features/achievements/achievements.api.ts).
// Seeded directly in this migration (not a seeder) because every
// environment needs this reference data to exist, not just demo installs.
// `key` mirrors the frontend's stable string ids and doubles as the primary
// key so achievements.service.ts's unlock-rule engine can reference badges
// by the same short names used in the UI.
const CATALOG = [
  {
    id: 'first-habit',
    icon: '🌱',
    title: 'First Habit Created',
    description: 'Create your first routine',
    sort_order: 1,
  },
  {
    id: 'streak-7',
    icon: '🔥',
    title: '7-Day Streak',
    description: 'Keep any habit going for 7 days straight',
    sort_order: 2,
  },
  {
    id: 'checkins-50',
    icon: '💯',
    title: '50 Check-ins',
    description: 'Log 50 completed check-ins',
    sort_order: 3,
  },
  {
    id: 'early-bird',
    icon: '🌅',
    title: 'Early Bird',
    description: 'Check in before 7 AM',
    sort_order: 4,
  },
  {
    id: 'streak-30',
    icon: '🔥',
    title: '30-Day Streak',
    description: 'Keep any habit going for 30 days straight',
    sort_order: 5,
  },
  {
    id: 'checkins-100',
    icon: '💯',
    title: '100 Check-ins',
    description: 'Log 100 completed check-ins',
    sort_order: 6,
  },
  {
    id: 'perfect-week',
    icon: '🗓️',
    title: 'Perfect Week',
    description: 'Complete every habit, 7 days straight',
    sort_order: 7,
  },
  {
    id: 'streak-100',
    icon: '🔥',
    title: '100-Day Streak',
    description: 'Keep any habit going for 100 days straight',
    sort_order: 8,
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'achievements',
      {
        id: {
          type: Sequelize.STRING(40),
          primaryKey: true,
          allowNull: false,
        },
        icon: {
          type: Sequelize.STRING(16),
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        // Static fallback hint shown while locked, before any dynamic
        // countdown text the service computes (e.g. "18 more days to go").
        description: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        sort_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
    );

    const now = new Date();
    await queryInterface.bulkInsert(
      'achievements',
      CATALOG.map((row) => ({ ...row, created_at: now, updated_at: now })),
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('achievements');
  },
};
