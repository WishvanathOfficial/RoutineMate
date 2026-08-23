'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'user_preferences',
      {
        id: {
          type: Sequelize.CHAR(36),
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          unique: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        theme: {
          type: Sequelize.ENUM('light', 'dark', 'system'),
          allowNull: false,
          defaultValue: 'system',
        },
        push_reminders_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        daily_digest_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        first_day_of_week: {
          type: Sequelize.STRING(10),
          allowNull: false,
          defaultValue: 'monday',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_preferences');
  },
};
