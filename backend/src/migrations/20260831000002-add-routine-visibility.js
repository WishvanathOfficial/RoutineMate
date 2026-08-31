module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('routines', 'visibility', { type: Sequelize.ENUM('private', 'friends', 'public'), allowNull: false, defaultValue: 'private' });
    await queryInterface.addIndex('routines', ['user_id', 'visibility']);
  },
  async down(queryInterface) {
    await queryInterface.removeIndex('routines', ['user_id', 'visibility']);
    await queryInterface.removeColumn('routines', 'visibility');
  },
};
