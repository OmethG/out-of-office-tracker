import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/auth';
import { query } from '../../../../../lib/db';
import { sendManagerCancelledEmail } from '../../../../../lib/email';
import { pushCancelled } from '../../../../../lib/notify';

// Staff: cancel one of their own requests. Pending ones any time; approved ones until they start.
export async function POST(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'staff') {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) return NextResponse.json({ error: "We couldn't find that request." }, { status: 404 });

  // One statement, so a manager approving at the same moment can't race it.
  const { rows } = await query(
    `WITH old AS (
       SELECT id, status FROM leave_requests WHERE id = $1 AND employee_name = $2 FOR UPDATE
     )
     UPDATE leave_requests r SET status = 'cancelled', cancelled_at = now()
     FROM old
     WHERE r.id = old.id AND r.returned_at IS NULL
       AND (old.status = 'pending' OR (old.status = 'approved' AND r.leave_time > now()))
     RETURNING r.*, old.status AS was`,
    [id, session.name]
  );
  const row = rows[0];
  if (!row) {
    const { rows: found } = await query('SELECT status FROM leave_requests WHERE id = $1 AND employee_name = $2', [id, session.name]);
    if (!found[0]) return NextResponse.json({ error: "We couldn't find that request." }, { status: 404 });
    if (found[0].status === 'cancelled') return NextResponse.json({ error: 'This request is already cancelled.' }, { status: 409 });
    if (found[0].status === 'declined') return NextResponse.json({ error: 'This request was declined, so there is nothing to cancel.' }, { status: 409 });
    return NextResponse.json({ error: 'This has already started, so it can no longer be cancelled here. Please speak to your manager.' }, { status: 409 });
  }

  // A cancelled medical request doesn't keep its certificate.
  if (row.certificate_name) {
    await query('DELETE FROM leave_attachments WHERE request_id = $1', [row.id]);
    await query('UPDATE leave_requests SET certificate_name = NULL WHERE id = $1', [row.id]);
  }

  // The manager only needs telling when something they approved is cancelled.
  if (row.was === 'approved') {
    await pushCancelled(row);
    try {
      await sendManagerCancelledEmail(row);
    } catch (err) {
      console.error('Failed to email manager about cancellation', err);
    }
  }
  return NextResponse.json({ ok: true });
}
