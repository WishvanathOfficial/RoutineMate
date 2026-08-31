'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_achievements', {
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
      achievement_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: 'achievements', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      // Presence of a row IS the unlock — no boolean flag needed. See
      // achievements.service.ts's rule engine, which inserts one row per
      // newly-satisfied rule and never deletes them (badges don't re-lock).
      unlocked_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('user_achievements', ['user_id']);
    await queryInterface.addConstraint('user_achievements', {
      fields: ['user_id', 'achievement_id'],
      type: 'unique',
      name: 'user_achievements_user_id_achievement_id_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_achievements');
  },
};
