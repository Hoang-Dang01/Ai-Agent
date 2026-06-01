import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root or active folder
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config(); // Fallback to local app .env

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || process.env.DB_URL || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'replace_this_with_a_secure_jwt_secret_key_in_production',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  AI_ENGINE_URL: process.env.AI_ENGINE_URL || 'http://localhost:8000',
};

// Validate critical variables on startup
const missingVars: string[] = [];

if (!env.DATABASE_URL) {
  missingVars.push('DATABASE_URL or DB_URL');
}

if (!env.REDIS_URL) {
  missingVars.push('REDIS_URL');
}

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'replace_this_with_a_secure_jwt_secret_key_in_production') {
  console.warn('[Warning] Using default JWT secret in production mode is dangerous.');
}

if (missingVars.length > 0) {
  const errorMessage = `[Secrets Management Collapse] Missing critical environment variables on boot: ${missingVars.join(', ')}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}
