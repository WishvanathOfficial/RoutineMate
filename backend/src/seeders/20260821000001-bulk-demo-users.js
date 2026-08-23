'use strict';

const bcrypt = require('bcryptjs');

// 10 extra demo accounts (in addition to demo@routinemate.app) so the app can
// be explored with different personas — each one logs in with the same
// password and already has routines/habit-logs/preferences seeded (see the
// two seeder files that follow this one), so every screen (Dashboard, Stats
// charts, Calendar heatmap, Routines list, Profile) has real data on first
// login instead of an empty state.
const DEMO_PASSWORD = 'Demo@1234';

const USERS = [
  { id: '44444444-4444-4444-8444-444444444401', name: 'Ava Martinez', email: 'ava.martinez@routinemate.app', theme: 'light', push: true, digest: true },
  { id: '44444444-4444-4444-8444-444444444402', name: 'Liam Chen', email: 'liam.chen@routinemate.app', theme: 'dark', push: true, digest: false },
  { id: '44444444-4444-4444-8444-444444444403', name: 'Sophia Patel', email: 'sophia.patel@routinemate.app', theme: 'system', push: false, digest: true },
  { id: '44444444-4444-4444-8444-444444444404', name: 'Noah Kim', email: 'noah.kim@routinemate.app', theme: 'light', push: true, digest: false },
  { id: '44444444-4444-4444-8444-444444444405', name: 'Isabella Rossi', email: 'isabella.rossi@routinemate.app', theme: 'dark', push: false, digest: false },
  { id: '44444444-4444-4444-8444-444444444406', name: 'Ethan Johnson', email: 'ethan.johnson@routinemate.app', theme: 'system', push: true, digest: true },
  { id: '44444444-4444-4444-8444-444444444407', name: 'Mia Nguyen', email: 'mia.nguyen@routinemate.app', theme: 'light', push: false, digest: true },
  { id: '44444444-4444-4444-8444-444444444408', name: 'Lucas Silva', email: 'lucas.silva@routinemate.app', theme: 'dark', push: true, digest: false },
  { id: '44444444-4444-4444-8444-444444444409', name: 'Amara Okafor', email: 'amara.okafor@routinemate.app', theme: 'system', push: true, digest: true },
  { id: '44444444-4444-4444-8444-444444444410', name: 'Daniel Novak', email: 'daniel.novak@routinemate.app', theme: 'light', push: false, digest: false },
];

function prefsIdFor(userId) {
  // Deterministic 1:1 companion id — swap the user_id block's leading digit
  // (4 -> 5) so it's easy to eyeball the pairing while browsing the table.
  return userId.replace('4444-4444-8444', '5555-4555-8555');
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const now = new Date();

    await queryInterface.bulkInsert(
      'users',
      USERS.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password_hash: passwordHash,
        avatar_url: null,
        email_verified_at: now,
        created_at: now,
        updated_at: now,
      })),
    );

    await queryInterface.bulkInsert(
      'user_preferences',
      USERS.map((u) => ({
        id: prefsIdFor(u.id),
        user_id: u.id,
        theme: u.theme,
        push_reminders_enabled: u.push,
        daily_digest_enabled: u.digest,
        first_day_of_week: 'monday',
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_preferences', { user_id: USERS.map((u) => u.id) });
    await queryInterface.bulkDelete('users', { id: USERS.map((u) => u.id) });
  },
};

module.exports.USERS = USERS;
module.exports.DEMO_PASSWORD = DEMO_PASSWORD;
