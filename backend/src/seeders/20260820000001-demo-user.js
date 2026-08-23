'use strict';

const bcrypt = require('bcryptjs');

const DEMO_USER_ID = '11111111-1111-4111-8111-111111111111';
const DEMO_PREFS_ID = '22222222-2222-4222-8222-222222222222';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Demo@1234', 12);
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        id: DEMO_USER_ID,
        name: 'Demo User',
        email: 'demo@routinemate.app',
        password_hash: passwordHash,
        avatar_url: null,
        email_verified_at: now,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('user_preferences', [
      {
        id: DEMO_PREFS_ID,
        user_id: DEMO_USER_ID,
        theme: 'system',
        push_reminders_enabled: true,
        daily_digest_enabled: false,
        first_day_of_week: 'monday',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_preferences', { user_id: DEMO_USER_ID });
    await queryInterface.bulkDelete('users', { id: DEMO_USER_ID });
  },
};

module.exports.DEMO_USER_ID = DEMO_USER_ID;
