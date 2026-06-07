import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import apiRoutes from './routes/index.js';

const app = express();

// ── CORS ────────────────────────────────────────────────────────────────────
// In development: allow all origins (needed for Expo Go on LAN / Metro)
// In production:  allow explicit CLIENT_URL list + all *.vercel.app previews
const allowedOrigins = env.CLIENT_URL
  ? env.CLIENT_URL.split(',').map((u) => u.trim())
  : [];

// Matches any Vercel deployment (prod + preview branches)
const vercelOriginRegex = /^https:\/\/[\w-]+-[\w-]+-s-projects\.vercel\.app$|^https:\/\/[\w-]+\.vercel\.app$/;

app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? (origin, cb) => {
        // allow server-to-server (no origin), listed origins, or any vercel.app subdomain
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        if (vercelOriginRegex.test(origin)) return cb(null, true);
        return cb(new Error(`CORS: origin "${origin}" not allowed`));
      }
    : true, // allow everything in dev
  credentials: true,
}));

app.use(helmet());
app.use(globalLimiter);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Health check (required for Render) ──────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok',
  env: env.NODE_ENV,
  timestamp: new Date().toISOString(),
}));

app.use('/api/v1', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
