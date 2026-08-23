'use strict';

/**
 * Runs before `npm run dev` (wired via the `predev` script in package.json)
 * so a single `npm run dev` — from this folder, or via the root `npm run
 * dev` that runs both frontend+backend concurrently — brings up a fully
 * ready backend: pending migrations applied, demo data present, then the
 * API server starts.
 *
 * - Migrations are always safe to re-run (sequelize-cli tracks applied ones
 *   in the SequelizeMeta table and only applies what's new).
 * - Seeding is NOT safe to re-run blindly (bulkInsert isn't idempotent —
 *   re-seeding an already-seeded DB throws duplicate-key errors), so this
 *   checks whether the `users` table already has rows and skips db:seed if
 *   so. Use `npm run db:seed:undo` first if you want to reset and re-seed.
 */

const { execSync } = require('child_process');
const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '..');

function run(cmd) {
  console.log(`\n[bootstrap] ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: BACKEND_ROOT });
}

async function isAlreadySeeded() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Sequelize } = require('sequelize');
  const env = process.env.NODE_ENV || 'development';
  // config/config.js already loads .env itself — see backend/config/config.js.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require(path.join(BACKEND_ROOT, 'config', 'config.js'))[env];

  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: false,
  });

  try {
    const [rows] = await sequelize.query('SELECT COUNT(*) AS count FROM users');
    return Number(rows[0].count) > 0;
  } catch (err) {
    // Most likely the `users` table doesn't exist yet on a brand new
    // database — migrations (which run right before this check) will have
    // just created it, so treat "can't query it" as "not seeded".
    return false;
  } finally {
    await sequelize.close();
  }
}

async function main() {
  console.log('[bootstrap] Ensuring database schema is up to date…');
  run('npx sequelize-cli db:migrate');

  if (await isAlreadySeeded()) {
    console.log(
      '[bootstrap] Database already has data — skipping db:seed. ' +
        '(Run `npm run db:seed:undo` first if you want to reset the demo data.)',
    );
  } else {
    console.log('[bootstrap] Empty database detected — seeding demo data…');
    run('npx sequelize-cli db:seed:all');
  }

  console.log('[bootstrap] Ready — starting the API server.\n');
}

main().catch((err) => {
  console.error('\n[bootstrap] Failed to prepare the database:', err.message || err);
  console.error(
    '[bootstrap] Check backend/.env (DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD) ' +
      'and that MySQL is running, then try again.',
  );
  process.exit(1);
});
