'use strict';

// MVP-2 §3.5/§3.6 "Weekly email summary" preference — was shipped as
// local-only React state during the UI-first pass (a toast implied it
// saved, but a refresh silently reset it). This gives it a real column
// alongside the existing dailyDigestEnabled/pushRemindersEnabled prefs.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_preferences', 'weekly_email_enabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('user_preferences', 'weekly_email_enabled');
  },
};
