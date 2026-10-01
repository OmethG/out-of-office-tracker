import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/auth';
import { query } from '../../../../../lib/db';
import { canCheckIn } from '../../../../../lib/checkin';
import { atLocal, localDate, timeLabel } from '../../../../../lib/time';

// A couple of minutes' grace for phone clocks that run a little ahead.
const CLOCK_SLACK_MS = 2 * 60 * 1000;

// Staff: "I'm back" on one of their own step outs. Body: { time: "15:00" } (Sri Lanka time, today).
export async function POST(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'staff') {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const time = typeof body?.time === 'string' ? body.time : '';
  if (!/^\d{1,9}$/.test(id)) {
    return NextResponse.json({ error: "We couldn't find that request." }, { status: 404 });
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return NextResponse.json({ error: 'Choose the time you got back.' }, { status: 400 });
  }

  const { rows } = await query('SELECT * FROM leave_requests WHERE id = $1 AND employee_name = $2', [id, session.name]);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "We couldn't find that request." }, { status: 404 });
  if (row.returned_at) return NextResponse.json({ error: "You've already checked in for this one." }, { status: 409 });

  const now = new Date();
  if (!canCheckIn(row, now)) {
    return NextResponse.json({ error: "Check-in isn't open for this request." }, { status: 400 });
  }

  const back = atLocal(localDate(now), time);
  if (back < new Date(row.leave_time)) {
    return NextResponse.json({ error: `That's before you left (${timeLabel(row.leave_time)}).` }, { status: 400 });
  }
  if (back - now > CLOCK_SLACK_MS) {
    return NextResponse.json({ error: "That time hasn't come yet. Choose the time you got back." }, { status: 400 });
  }

  // Only the first check-in counts; it can't be changed afterwards.
  const updated = await query(
    `UPDATE leave_requests SET returned_at = $1
     WHERE id = $2 AND employee_name = $3 AND returned_at IS NULL
     RETURNING id`,
    [back.toISOString(), id, session.name]
  );
  if (updated.rowCount === 0) {
    return NextResponse.json({ error: "You've already checked in for this one." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
