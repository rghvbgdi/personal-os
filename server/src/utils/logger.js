import winston from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, colorize, printf, json } = winston.format;

const devFormat = printf(({ level, message, timestamp }) =>
  `${timestamp} [${level}]: ${message}`
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: env.NODE_ENV === 'production'
    ? combine(timestamp(), json())
    : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), devFormat),
  transports: [new winston.transports.Console()],
});
