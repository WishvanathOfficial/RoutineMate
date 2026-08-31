/**
 * Keep bundle/routine UUID joins comparable on MySQL 8 installations where
 * the database default is utf8mb4_0900_ai_ci but MVP2 tables use
 * utf8mb4_unicode_ci.
 */
module.exports = {
  async up(queryInterface) {
    for (const table of ['routine_bundles', 'routine_bundle_items', 'bundle_check_ins']) {
      await queryInterface.sequelize.query(
        `ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
    }
  },

  async down(queryInterface) {
    for (const table of ['routine_bundles', 'routine_bundle_items', 'bundle_check_ins']) {
      await queryInterface.sequelize.query(
        `ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
      );
    }
  },
};
