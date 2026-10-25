'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE challenge_reactions AS reaction
      INNER JOIN challenge_check_ins AS duplicate_check_in
        ON duplicate_check_in.id = reaction.check_in_id
      INNER JOIN (
        SELECT challenge_id, user_id, date, MIN(id) AS retained_id
        FROM challenge_check_ins
        GROUP BY challenge_id, user_id, date
      ) AS retained_check_in
        ON retained_check_in.challenge_id = duplicate_check_in.challenge_id
        AND retained_check_in.user_id = duplicate_check_in.user_id
        AND retained_check_in.date = duplicate_check_in.date
      SET reaction.check_in_id = retained_check_in.retained_id
      WHERE duplicate_check_in.id <> retained_check_in.retained_id
    `);

    await queryInterface.sequelize.query(`
      DELETE duplicate_check_in
      FROM challenge_check_ins AS duplicate_check_in
      INNER JOIN (
        SELECT challenge_id, user_id, date, MIN(id) AS retained_id
        FROM challenge_check_ins
        GROUP BY challenge_id, user_id, date
      ) AS retained_check_in
        ON retained_check_in.challenge_id = duplicate_check_in.challenge_id
        AND retained_check_in.user_id = duplicate_check_in.user_id
        AND retained_check_in.date = duplicate_check_in.date
      WHERE duplicate_check_in.id <> retained_check_in.retained_id
    `);

    await queryInterface.addIndex('challenge_check_ins', ['challenge_id', 'user_id', 'date'], {
      unique: true,
      name: 'challenge_check_ins_one_per_user_day',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('challenge_check_ins', 'challenge_check_ins_one_per_user_day');
  },
};
