import { query } from './db';
import { sendEmployeeDecisionEmail } from './email';
import { pushDecision } from './notify';

// Approve or decline one request, by id (from the app) or by token (from the email link).
// Only a pending request changes, so the app and the email can't both decide it.
export async function decide({ id, token }, action) {
  const status = action === 'approve' ? 'approved' : 'declined';
  const byId = id !== undefined && id !== null;
  const key = byId ? Number(id) : String(token);
  const where = byId ? 'id = $2' : 'decision_token = $2';

  const { rows } = await query(
    `UPDATE leave_requests SET status = $1, decided_at = now() WHERE ${where} AND status = 'pending' RETURNING *`,
    [status, key]
  );
  if (rows[0]) {
    await pushDecision(rows[0]);
    await sendEmployeeDecisionEmail(rows[0]);
    return { row: rows[0], changed: true };
  }
  const existing = await query(`SELECT * FROM leave_requests WHERE ${byId ? 'id = $1' : 'decision_token = $1'}`, [key]);
  return { row: existing.rows[0] || null, changed: false };
}
