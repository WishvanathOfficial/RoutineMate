'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'habit_logs',
      {
        id: {
          type: Sequelize.CHAR(36),
          primaryKey: true,
          allowNull: false,
        },
        routine_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          references: { model: 'routines', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('done', 'partial', 'skipped', 'missed'),
          allowNull: false,
        },
        value: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
        },
        note: {
          type: Sequelize.STRING(500),
          allowNull: true,
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
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
    );
    await queryInterface.addIndex('habit_logs', ['routine_id', 'date'], {
      unique: true,
      name: 'habit_logs_routine_id_date_unique',
    });
    await queryInterface.addIndex('habit_logs', ['date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('habit_logs');
  },
};
