import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { sendManagerApprovalEmail } from '../../../lib/email';
import { describe } from '../../../lib/requests';
import { DAY_END, DAY_START, HALF_DAY, SATURDAY_END, addDays, atLocal, isSaturday, isSunday, isYmd, workingDays } from '../../../lib/time';

// Staff: send a leave request, full day(s) or half day.
export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'staff') {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const type = body?.type;
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  const start = body?.start;
  const end = type === 'half' ? body?.start : body?.end;
  const half = body?.half;

  if (!['full', 'half'].includes(type) || !isYmd(start) || !isYmd(end)) {
    return NextResponse.json({ error: 'Choose the date(s) for your leave.' }, { status: 400 });
  }
  if (!reason) return NextResponse.json({ error: 'Please add a short reason.' }, { status: 400 });
  if (reason.length > 500) {
    return NextResponse.json({ error: 'Keep the reason under 500 characters.' }, { status: 400 });
  }

  let days;
  let leaveTime;
  let returnTime;
  if (type === 'full') {
    if (end < start) return NextResponse.json({ error: 'The last day is before the first day.' }, { status: 400 });
    if (end > addDays(start, 90)) {
      return NextResponse.json({ error: 'For more than 90 days, speak to your manager directly.' }, { status: 400 });
    }
    days = workingDays(start, end);
    if (days === 0) return NextResponse.json({ error: 'Sunday is already a day off. Choose a working day.' }, { status: 400 });
    leaveTime = atLocal(start, DAY_START);
    returnTime = atLocal(end, isSaturday(end) ? SATURDAY_END : DAY_END);
  } else {
    if (!HALF_DAY[half]) return NextResponse.json({ error: 'Choose morning or afternoon.' }, { status: 400 });
    if (isSunday(start)) return NextResponse.json({ error: 'Sunday is already a day off. Choose a working day.' }, { status: 400 });
    if (isSaturday(start) && half === 'afternoon') {
      return NextResponse.json({ error: 'Saturdays finish at 1 PM, so choose the morning.' }, { status: 400 });
    }
    days = 0.5;
    leaveTime = atLocal(start, HALF_DAY[half].start);
    returnTime = atLocal(start, HALF_DAY[half].end);
  }

  const token = crypto.randomBytes(24).toString('hex');
  const { rows } = await query(
    `INSERT INTO leave_requests
      (kind, leave_type, start_date, end_date, half, days,
       employee_name, employee_email, leave_time, expected_return_time, reason, decision_token)
     VALUES ('leave', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      type,
      start,
      end,
      type === 'half' ? half : null,
      days,
      session.name,
      session.email,
      leaveTime.toISOString(),
      returnTime.toISOString(),
      reason,
      token,
    ]
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
