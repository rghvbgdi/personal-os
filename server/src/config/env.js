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
  // Comma-separated list of allowed origins: e.g.
  //   "https://my-app.vercel.app,https://my-app-git-main.vercel.app"
  // In development this is unused (all origins allowed).
  CLIENT_URL:          optional('CLIENT_URL', 'http://localhost:5173'),
  BCRYPT_ROUNDS:       parseInt(optional('BCRYPT_ROUNDS', '12'), 10),
};
