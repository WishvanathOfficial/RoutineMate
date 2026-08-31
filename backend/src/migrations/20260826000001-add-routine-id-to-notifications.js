'use strict';

// Supports the notification-generation engine (see
// backend/src/services/notificationGenerator.service.ts) — reminder and
// streak-risk notifications are per-routine, and this column both lets them
// dedupe ("has a reminder already fired for THIS routine today?") and lets
// the frontend eventually deep-link a notification back to its routine.
// Achievement/digest notifications leave this null (they aren't tied to a
// single routine).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('notifications', 'routine_id', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      references: { model: 'routines', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addIndex('notifications', ['routine_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('notifications', 'routine_id');
  },
};
