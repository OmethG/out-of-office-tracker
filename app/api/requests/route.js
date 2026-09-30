import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { sendManagerApprovalEmail } from '../../../lib/email';
import { describe } from '../../../lib/requests';

// Staff: send a step-out request. The name always comes from the sign-in, never from the form.
export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'staff') {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { leaveTime, expectedReturnTime } = body || {};
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';

  if (!leaveTime || !expectedReturnTime || !reason) {
    return NextResponse.json({ error: 'Please fill in every field.' }, { status: 400 });
  }
  if (reason.length > 500) {
    return NextResponse.json({ error: 'Keep the reason under 500 characters.' }, { status: 400 });
  }
  const start = new Date(leaveTime);
  const end = new Date(expectedReturnTime);
  if (isNaN(start) || isNaN(end)) {
    return NextResponse.json({ error: 'Check the times and try again.' }, { status: 400 });
  }
  if (end <= start) {
    return NextResponse.json({ error: '"Back by" needs to be after "Leaving at".' }, { status: 400 });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const { rows } = await query(
    `INSERT INTO leave_requests
      (kind, employee_name, employee_email, leave_time, expected_return_time, reason, decision_token)
     VALUES ('step_out', $1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [session.name, session.email, start.toISOString(), end.toISOString(), reason, token]
  );
  const row = rows[0];
  const d = describe(row);

  try {
    await sendManagerApprovalEmail(row);
  } catch (err) {
    console.error('Failed to email manager', err);
    return NextResponse.json({
      ok: true,
      id: row.id,
      title: d.title,
      when: d.when,
      warning: "Saved, but the email to your manager didn't send. Please let them know directly.",
    });
  }
  return NextResponse.json({ ok: true, id: row.id, title: d.title, when: d.when });
}
