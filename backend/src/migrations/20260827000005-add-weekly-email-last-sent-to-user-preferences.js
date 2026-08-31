'use strict';

// Supports docs/RoutineMate-MVP2-Scope.md §3.7 "weekly summary email" — the
// weekly email sweep (services/weeklyEmail.service.ts) needs a persisted
// per-user timestamp to dedupe against, the same way reminders/streak-risk
// notifications dedupe against existing rows, since a weekly cadence is too
// long to rely on a single exact-minute match the way the daily digest does.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_preferences', 'weekly_email_last_sent_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('user_preferences', 'weekly_email_last_sent_at');
  },
};
