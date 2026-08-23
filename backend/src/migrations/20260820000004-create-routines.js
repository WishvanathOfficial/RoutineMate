'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'routines',
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
        name: {
          type: Sequelize.STRING(120),
          allowNull: false,
        },
        emoji: {
          type: Sequelize.STRING(16),
          allowNull: false,
          defaultValue: '✅',
        },
        category: {
          type: Sequelize.ENUM(
            'Health',
            'Mindfulness',
            'Learning',
            'Wellness',
            'Productivity',
          ),
          allowNull: false,
        },
        frequency_type: {
          type: Sequelize.ENUM('daily', 'weekdays', 'specific_days', 'interval'),
          allowNull: false,
        },
        frequency_config: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        reminder_type: {
          type: Sequelize.ENUM('time', 'location'),
          allowNull: false,
          defaultValue: 'time',
        },
        reminder_time: {
          type: Sequelize.TIME,
          allowNull: true,
        },
        reminder_location: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        target_value: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        target_unit: {
          type: Sequelize.STRING(30),
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM('active', 'paused', 'archived'),
          allowNull: false,
          defaultValue: 'active',
        },
        current_streak: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        longest_streak: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
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
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      },
      {
        charset: 'utf8mb4', // required for the emoji column
        collate: 'utf8mb4_unicode_ci',
      },
    );
    await queryInterface.addIndex('routines', ['user_id']);
    await queryInterface.addIndex('routines', ['user_id', 'status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('routines');
  },
};
