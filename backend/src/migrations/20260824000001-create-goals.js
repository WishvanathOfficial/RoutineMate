'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'goals',
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
        title: {
          type: Sequelize.STRING(160),
          allowNull: false,
        },
        emoji: {
          type: Sequelize.STRING(16),
          allowNull: false,
          defaultValue: '🎯',
        },
        target_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('active', 'completed'),
          allowNull: false,
          defaultValue: 'active',
        },
        // Array of routine.id strings this goal is linked to — see
        // docs/RoutineMate-MVP2-Scope.md §5 "Goal". A JSON array keeps this
        // simple (small, rarely-queried-by-content list) rather than a join
        // table.
        linked_routine_ids: {
          type: Sequelize.JSON,
          allowNull: false,
          defaultValue: [],
        },
        completed_at: {
          type: Sequelize.DATE,
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
        charset: 'utf8mb4', // emoji column
        collate: 'utf8mb4_unicode_ci',
      },
    );
    await queryInterface.addIndex('goals', ['user_id']);
    await queryInterface.addIndex('goals', ['user_id', 'status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('goals');
  },
};
