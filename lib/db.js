import { Pool } from 'pg';

let pool;
function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Add it to your environment variables.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

let schemaReady = null;
async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id SERIAL PRIMARY KEY,
        employee_name TEXT NOT NULL,
        employee_email TEXT,
        leave_time TIMESTAMPTZ NOT NULL,
        expected_return_time TIMESTAMPTZ NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        decision_token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        decided_at TIMESTAMPTZ
      );
    `);
  }
  await schemaReady;
}

export async function query(text, params) {
  await ensureSchema();
  return getPool().query(text, params);
}
