require('dotenv').config();

// Shared by both the app (via src/config/database.ts) and the Sequelize
// CLI (migrations/seeders), so connection settings only live in one place.
const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  charset: 'utf8mb4',
  dialectOptions: {
    charset: 'utf8mb4',
  },
  define: {
    underscored: true,
    timestamps: true,
  },
};

module.exports = {
  development: base,
  test: { ...base, database: `${process.env.DB_NAME}_test`, logging: false },
  production: { ...base, logging: false },
};
