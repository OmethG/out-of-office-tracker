import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '../../../lib/db';
import { findEmployee } from '../../../lib/employees';
import { sendManagerApprovalEmail } from '../../../lib/email';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { employeeName, leaveTime, expectedReturnTime, reason } = body || {};

  if (!employeeName || !leaveTime || !expectedReturnTime || !reason) {
    return NextResponse.json({ error: 'Please fill in every field.' }, { status: 400 });
  }
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return NextResponse.json({ error: 'Please add a short reason.' }, { status: 400 });
  }
  if (reason.length > 500) {
    return NextResponse.json({ error: 'Reason is too long (max 500 characters).' }, { status: 400 });
  }
  if (isNaN(Date.parse(leaveTime)) || isNaN(Date.parse(expectedReturnTime))) {
    return NextResponse.json({ error: 'Invalid date/time.' }, { status: 400 });
  }

  const employee = findEmployee(employeeName);
  if (!employee) {
    return NextResponse.json({ error: 'Unknown employee. Please pick your name from the list.' }, { status: 400 });
  }

  const token = crypto.randomBytes(24).toString('hex');

  const result = await query(
    `INSERT INTO leave_requests
      (employee_name, employee_email, leave_time, expected_return_time, reason, decision_token)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [employeeName, employee.email || null, leaveTime, expectedReturnTime, reason.trim(), token]
  );

  try {
    await sendManagerApprovalEmail({
      token,
      employeeName,
      leaveTime,
      expectedReturnTime,
      reason: reason.trim(),
    });
  } catch (err) {
    console.error('Failed to email manager', err);
    return NextResponse.json(
      { ok: true, id: result.rows[0].id, warning: 'Saved, but the manager email failed to send. Please let them know directly.' },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, id: result.rows[0].id });
}
