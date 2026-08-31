import { createApp } from './app';
import { assertDbConnection } from './config/database';
import { env } from './config/env';
import { startNotificationScheduler } from './jobs/notificationScheduler';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  try {
    await assertDbConnection();
    logger.info('Database connection established.');
  } catch (err) {
    logger.error('Unable to connect to the database:', err);
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`RoutineMate API listening on http://localhost:${env.port}`);
  });

  // Reminder / streak-risk / daily-digest notifications — see
  // jobs/notificationScheduler.ts and services/notificationGenerator.service.ts.
  startNotificationScheduler();
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});

bootstrap();
