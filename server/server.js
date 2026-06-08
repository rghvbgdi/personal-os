import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { env } from './src/config/env.js';
import { logger } from './src/utils/logger.js';
import { startReminderCron } from './src/services/reminderCron.js';

async function bootstrap() {
  await connectDB();

  // Start reminder cron job (push notifications for events & tasks)
  startReminderCron();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${env.PORT} is already in use. Set a different PORT in your .env file.`);
    } else {
      logger.error(`Server error: ${err.message}`);
    }
    process.exit(1);
  });

  process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
  process.on('SIGINT',  () => { server.close(() => process.exit(0)); });
}

bootstrap();
