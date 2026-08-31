'use strict';

// Follow-up to 20260824000002-create-achievements.js — adds the badge tiers
// that were missing against docs/RoutineMate-MVP2-Scope.md §3.1: the
// 365-day streak, the 500-checkin milestone, and a real "4 weeks at 90%+"
// consistency badge (see achievements.service.ts's meetsConsistencyThreshold
// for its automatic unlock rule — unlike `perfect-week`, this one is
// actually reachable through normal app use).
//
// Added as a new migration rather than editing the original catalog insert
// so environments that already ran that migration just pick these rows up
// on their next `db:migrate`.
const NEW_BADGES = [
  {
    id: 'streak-365',
    icon: '👑',
    title: '365-Day Streak',
    description: 'Keep any habit going for 365 days straight',
    sort_order: 9,
  },
  {
    id: 'checkins-500',
    icon: '💯',
    title: '500 Check-ins',
    description: 'Log 500 completed check-ins',
    sort_order: 10,
  },
  {
    id: 'consistency-4wk',
    icon: '🎯',
    title: 'Consistency Champion',
    description: 'Complete 90%+ of your habits over 4 weeks',
    sort_order: 11,
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'achievements',
      NEW_BADGES.map((row) => ({ ...row, created_at: now, updated_at: now })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('achievements', {
      id: NEW_BADGES.map((row) => row.id),
    });
  },
};
