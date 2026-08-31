'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('journal_entries', {
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      mood: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: false,
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
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });
    // One entry per user per day — POST /api/journal upserts against this.
    await queryInterface.addConstraint('journal_entries', {
      fields: ['user_id', 'date'],
      type: 'unique',
      name: 'journal_entries_user_id_date_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('journal_entries');
  },
};
