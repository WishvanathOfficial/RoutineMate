'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'challenges',
      {
        id: {
          type: Sequelize.CHAR(36),
          primaryKey: true,
          allowNull: false,
        },
        creator_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        title: {
          type: Sequelize.STRING(160),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        emoji: {
          type: Sequelize.STRING(16),
          allowNull: false,
          defaultValue: '🎯',
        },
        habit_template: {
          type: Sequelize.STRING(128),
          allowNull: true,
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        visibility: {
          type: Sequelize.ENUM('public', 'private'),
          allowNull: false,
          defaultValue: 'public',
        },
        status: {
          type: Sequelize.ENUM('active', 'completed', 'archived'),
          allowNull: false,
          defaultValue: 'active',
        },
        participant_ids: {
          type: Sequelize.JSON,
          allowNull: false,
          defaultValue: [],
        },
        participant_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        invite_token: {
          type: Sequelize.STRING(64),
          allowNull: true,
          unique: true,
        },
        max_participants: {
          type: Sequelize.INTEGER,
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
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    await queryInterface.addIndex('challenges', ['creator_id']);
    await queryInterface.addIndex('challenges', ['visibility']);
    await queryInterface.addIndex('challenges', ['status']);
    await queryInterface.addIndex('challenges', ['start_date', 'end_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('challenges');
  },
};
