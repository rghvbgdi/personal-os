import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack, path: req.path });

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  const statusCode = err.statusCode || 500;
  const message = env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({ success: false, message });
};

export const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
