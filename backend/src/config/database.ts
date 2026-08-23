import { Sequelize } from 'sequelize';
import { env } from './env';

// Single shared Sequelize instance, used by every model in src/models.
// utf8mb4 is required so habit emoji icons and other 4-byte unicode
// characters store correctly.
export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  dialectOptions: {
    charset: 'utf8mb4',
  },
  define: {
    underscored: true,
    timestamps: true,
  },
  logging: env.isProduction ? false : console.log,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export async function assertDbConnection(): Promise<void> {
  await sequelize.authenticate();
}
