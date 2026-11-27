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

  // PayPal Marketplace (Orders v2 Checkout + Payouts v1 Disbursement)
  PAYPAL_MODE:
    (process.env.PAYPAL_MODE || process.env.PAYPAL_ENV || 'sandbox').trim().toLowerCase() === 'live'
      ? ('live' as const)
      : ('sandbox' as const),
  PAYPAL_CLIENT_ID:
    (process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || '').trim(),
  PAYPAL_CLIENT_SECRET:
    (process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET || '').trim(),
  PAYPAL_WEBHOOK_ID: (process.env.PAYPAL_WEBHOOK_ID || '').trim(),
  PAYPAL_VND_RATE: (() => {
    const r = Number(process.env.PAYPAL_VND_RATE || process.env.PAYPAL_EXCHANGE_RATE || 25400);
    return Number.isFinite(r) && r >= 1000 ? r : 25400;
  })(),
  PAYPAL_PLATFORM_FEE_RATE: (() => {
    const f = Number(process.env.PAYPAL_PLATFORM_FEE_RATE?.trim() || 0.05);
    return Number.isFinite(f) && f >= 0 && f <= 0.5 ? f : 0.05;
  })(),
  PAYPAL_HOLD_DAYS: (() => {
    const d = Number(process.env.PAYPAL_HOLD_DAYS?.trim() || 0);
    return Number.isFinite(d) && d >= 0 ? Math.floor(d) : 0;
  })(),
  get PAYPAL_API_BASE() {
    return this.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  },

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

