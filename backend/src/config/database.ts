import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export let pool: pg.Pool;

try {
  pool = new Pool(
    env.DATABASE_URL
      ? { connectionString: env.DATABASE_URL, ssl: env.isProduction ? { rejectUnauthorized: false } : false }
      : {
          host: env.DB_HOST,
          port: env.DB_PORT,
          user: env.DB_USER,
          password: env.DB_PASSWORD,
          database: env.DB_NAME,
        }
  );

  pool.on('error', (err) => {
    console.error('[Database Pool Error]:', err.message);
  });
} catch (err: any) {
  console.warn('[Database Pool Warn]: Running with fallback store.');
}

/**
 * Execute SQL Query with safety wrapper
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query(text, params);
      return res.rows as T[];
    } finally {
      client.release();
    }
  } catch (error: any) {
    // Re-throw database error
    throw error;
  }
}

