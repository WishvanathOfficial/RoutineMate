'use strict';

// Supports per-check-in XP (docs/RoutineMate-MVP2-Scope.md §3.1 "Points/XP
// awarded per check-in") — see achievements.service.ts's awardCheckInXp()
// and routines.service.ts's checkIn(). Without this flag, toggling a habit
// done -> not-done -> done again on the same day would award XP every time;
// this column lets checkIn() award XP for a given (routine, date) exactly
// once, no matter how many times it's toggled afterward.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('habit_logs', 'xp_awarded', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('habit_logs', 'xp_awarded');
  },
};
