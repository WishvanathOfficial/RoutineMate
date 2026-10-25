'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE friendships CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE friendships CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',
    );
  },
};
