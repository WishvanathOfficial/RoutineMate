'use strict';

// Supports docs/RoutineMate-MVP2-Scope.md §3.5 "smart nudge" — a new
// notification type for "you usually check this in late, want to shift the
// reminder?" suggestions (see notificationGenerator.service.ts's
// generateSmartNudgeNotifications). MySQL ENUM columns need an explicit
// ALTER to widen, hence a dedicated migration rather than touching the
// original create-notifications.js.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('notifications', 'type', {
      type: Sequelize.ENUM('achievement', 'reminder', 'streak_risk', 'digest', 'nudge'),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('notifications', 'type', {
      type: Sequelize.ENUM('achievement', 'reminder', 'streak_risk', 'digest'),
      allowNull: false,
    });
  },
};
