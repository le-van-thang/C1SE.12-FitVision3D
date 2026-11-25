import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root if available, otherwise backend directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback local

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  
  // Database configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_NAME: process.env.DB_NAME || 'fitvision3d',
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT & Security
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fitvision_super_secret_access_jwt_key_2026_min32chars',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fitvision_super_secret_refresh_jwt_key_2026_min32chars',
  
  // Anti-Bot Turnstile
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || '',

  // Google Gemini AI (Server-side secret only - never expose via VITE_)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // SMTP / Email Service
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',

  // Shop Tax Lookup & eKYC Verification (Tier 3/4)
  CASSO_OPENAPI_URL: process.env.CASSO_OPENAPI_URL || 'https://openapi.casso.vn',
  CASSO_API_KEY: process.env.CASSO_API_KEY || '',
  EKYC_PROVIDER: process.env.EKYC_PROVIDER || 'local_qr_casso',
  KYC_HASH_PEPPER:
    process.env.KYC_HASH_PEPPER ||
    process.env.JWT_ACCESS_SECRET ||
    'dev-kyc-pepper-change-in-prod',

  isProduction: process.env.NODE_ENV === 'production',
};

// Fail-fast validation (Rule 06)
if (env.isProduction) {
  const requiredVars = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  for (const key of requiredVars) {
    if (!process.env[key] || process.env[key]?.includes('min32chars')) {
      console.error(`[FATAL] Missing secure ${key} in production environment!`);
      process.exit(1);
    }
  }
}

