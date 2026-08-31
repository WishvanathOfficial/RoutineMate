'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'notifications',
      {
        id: {
          type: Sequelize.CHAR(36),
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        type: {
          type: Sequelize.ENUM('achievement', 'reminder', 'streak_risk', 'digest'),
          allowNull: false,
        },
        message: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        read: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        // Only 'reminder' notifications expose a "Snooze 30m" action —
        // see notifications.service.ts.
        snoozeable: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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
    await queryInterface.addIndex('notifications', ['user_id', 'created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
