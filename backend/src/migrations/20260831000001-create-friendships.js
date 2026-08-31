module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('friendships', {
      id: { type: Sequelize.CHAR(36), primaryKey: true, allowNull: false },
      requester_id: { type: Sequelize.CHAR(36), allowNull: false },
      addressee_id: { type: Sequelize.CHAR(36), allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'accepted'), allowNull: false, defaultValue: 'pending' },
      invite_token: { type: Sequelize.STRING(96), allowNull: true, unique: true },
      invite_expires_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('friendships', ['requester_id', 'addressee_id'], { unique: true });
    await queryInterface.addIndex('friendships', ['addressee_id', 'status']);
    await queryInterface.addIndex('friendships', ['invite_token'], { unique: true });
  },
  async down(queryInterface) { await queryInterface.dropTable('friendships'); },
};
