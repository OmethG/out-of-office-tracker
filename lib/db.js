import { Pool, types } from 'pg';
import staffDates from '../config/staff-dates.json';

// Return DATE columns as plain "2026-10-06" strings instead of JS Dates,
// so leave dates never shift with the server's timezone.
types.setTypeParser(1082, (v) => v);

let pool;
function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set. Add it to your environment variables.');
    }
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    pool = new Pool({
      connectionString: url,
      ssl: local ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

let schemaReady = null;
async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(`
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
        -- Added for MethG Staff: one table holds both step-out and leave requests.
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'step_out';
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type TEXT;
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS start_date DATE;
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS end_date DATE;
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS half TEXT;
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS days NUMERIC(5,1);
        -- "I'm back" check-in for step outs. checkin_on is false for requests sent before
        -- check-in existed (so they never show "No check-in") and true for every new one.
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS checkin_on BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE leave_requests ALTER COLUMN checkin_on SET DEFAULT true;
        -- Annual or casual leave (null for step outs and short leave; older leave counts as annual).
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_category TEXT;
        -- Staff can cancel a request: status becomes 'cancelled'.
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
        -- Medical leave needs a certificate. The file lives in its own table so listing requests stays fast;
        -- certificate_name on the request says one is attached.
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS certificate_name TEXT;
        CREATE TABLE IF NOT EXISTS leave_attachments (
          request_id INTEGER PRIMARY KEY REFERENCES leave_requests(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          mime TEXT NOT NULL,
          size INTEGER NOT NULL,
          data BYTEA NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        -- Medical leave is casual leave marked as medical (it uses casual days). Requests made while
        -- "Medical" was its own type are moved across.
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS medical BOOLEAN NOT NULL DEFAULT false;
        UPDATE leave_requests SET medical = true, leave_category = 'casual' WHERE leave_category = 'medical';
        -- Short leave where the person leaves for the day and isn't coming back (no "I'm back" check-in).
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS no_return BOOLEAN NOT NULL DEFAULT false;
        CREATE INDEX IF NOT EXISTS leave_requests_employee_start_idx ON leave_requests (employee_name, start_date);
        CREATE INDEX IF NOT EXISTS leave_requests_leave_time_idx ON leave_requests (leave_time);
        -- Joining date and birthday for each person (shown in the Staff list).
        CREATE TABLE IF NOT EXISTS staff_profiles (
          name TEXT PRIMARY KEY,
          joined DATE,
          birthday DATE,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `)
      // First-time dates from config/staff-dates.json. A person already in the table is left alone,
      // so dates the manager edits in the app are never overwritten.
      .then(() =>
        getPool().query(
          `INSERT INTO staff_profiles (name, joined, birthday)
           SELECT * FROM unnest($1::text[], $2::date[], $3::date[])
           ON CONFLICT (name) DO NOTHING`,
          [staffDates.map((p) => p.name), staffDates.map((p) => p.joined), staffDates.map((p) => p.birthday)]
        )
      )
      .catch((err) => {
        schemaReady = null;
        throw err;
      });
  }
  await schemaReady;
}

export async function query(text, params) {
  await ensureSchema();
  return getPool().query(text, params);
}
