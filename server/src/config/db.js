import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connectWithRetry(attempt = 1) {
  try {
    await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // give Atlas 10 s on cold-start
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
    if (attempt < MAX_RETRIES) {
      logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s…`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectWithRetry(attempt + 1);
    }
    logger.error('Max retries reached – exiting.');
    process.exit(1);
  }
}

export async function connectDB() {
  await connectWithRetry();

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected – attempting reconnect…');
    connectWithRetry();
  });
}
