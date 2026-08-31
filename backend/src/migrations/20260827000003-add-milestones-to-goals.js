'use strict';

// Supports docs/RoutineMate-MVP2-Scope.md §3.2 "manual milestone checkpoints
// for goals that aren't purely check-in based" — see goals.service.ts's
// computeProgress(), which prefers milestone-based progress over the
// linked-routine-streak calculation whenever a goal has any milestones.
// Each row is `{ id, title, done }`; ids are assigned server-side in
// createGoal()/toggleMilestone() so the client never has to generate them.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('goals', 'milestones', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('goals', 'milestones');
  },
};
