'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('calendar_connections', 'time_zone', {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'UTC',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('calendar_connections', 'time_zone');
  },
};
