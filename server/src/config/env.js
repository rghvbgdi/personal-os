import dotenv from 'dotenv';
dotenv.config();

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val;
};

const optional = (key, fallback) => process.env[key] || fallback;

export const env = {
  NODE_ENV:            optional('NODE_ENV', 'development'),
  PORT:                parseInt(optional('PORT', '8000'), 10),
  MONGO_URI:           required('MONGO_URI'),
  JWT_SECRET:          required('JWT_SECRET'),
  JWT_REFRESH_SECRET:  required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES:  optional('JWT_ACCESS_EXPIRES', '15m'),
  JWT_REFRESH_EXPIRES: optional('JWT_REFRESH_EXPIRES', '7d'),
  CLIENT_URL:          optional('CLIENT_URL', 'http://localhost:5173'),
  BCRYPT_ROUNDS:       parseInt(optional('BCRYPT_ROUNDS', '12'), 10),
  // ── Web Push (VAPID) ──
  VAPID_PUBLIC_KEY:    optional('VAPID_PUBLIC_KEY', ''),
  VAPID_PRIVATE_KEY:   optional('VAPID_PRIVATE_KEY', ''),
  VAPID_EMAIL:         optional('VAPID_EMAIL', 'mailto:admin@example.com'),
};
