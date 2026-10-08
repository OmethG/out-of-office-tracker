import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { sendManagerApprovalEmail } from '../../../lib/email';
import { describe } from '../../../lib/requests';
import { pushNewRequest } from '../../../lib/notify';
import { balanceFor, balanceLine, leaveYear, medicalCountFor, medicalLine, needsCertificate } from '../../../lib/leave';
import { DAY_END, DAY_START, HALF_DAY, SATURDAY_END, addDays, atLocal, isSaturday, isSunday, isYmd, workingDays } from '../../../lib/time';

// From someone's 4th medical leave in a leave year, a certificate must come with it: one photo or PDF.
const MAX_FILE = 3.5 * 1024 * 1024;
function sniff(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length > 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  if (buf.length > 5 && buf.toString('latin1', 0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

// The form sends plain JSON, or multipart (fields + "certificate" file) when a certificate is attached.
async function readBody(req) {
  const type = req.headers.get('content-type') || '';
  if (!type.includes('multipart/form-data')) return { body: await req.json().catch(() => null), file: null };
  const form = await req.formData().catch(() => null);
  if (!form) return { body: null, file: null };
  const body = {};
  for (const [k, v] of form.entries()) if (typeof v === 'string') body[k] = v;
  const f = form.get('certificate');
  return { body, file: f && typeof f !== 'string' ? f : null };
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

// Staff: send a leave request: full day(s) or half day (annual or casual), or short leave (a few hours).
export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'staff') {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  const { body, file } = await readBody(req);
  const type = body?.type;
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  if (!['full', 'half', 'short'].includes(type)) {
    return NextResponse.json({ error: 'Choose full day, half day or short leave.' }, { status: 400 });
  }
  if (!reason) return NextResponse.json({ error: 'Please add a short reason.' }, { status: 400 });
  if (reason.length > 500) {
    return NextResponse.json({ error: 'Keep the reason under 500 characters.' }, { status: 400 });
  }

  let start;
  let end;
  let half = null;
  let category = null;
  let days = null;
  let leaveTime;
  let returnTime;
  let cert = null;
  let medical = false;
  let noReturn = false;

  if (type === 'short') {
    start = end = body?.date;
    const { from } = body || {};
    if (!isYmd(start)) return NextResponse.json({ error: 'Choose the date.' }, { status: 400 });
    // "I won't be coming back today": the leave runs to the end of the working day.
    noReturn = body?.noReturn === true || body?.noReturn === 'true';
    const to = noReturn ? (isSaturday(start) ? SATURDAY_END : DAY_END) : body?.to;
    if (!HHMM.test(from || '') || !HHMM.test(to || '')) {
      return NextResponse.json({ error: noReturn ? 'Choose the time you are leaving.' : 'Choose the leaving and back-by times.' }, { status: 400 });
    }
    if (noReturn && to <= from) {
      return NextResponse.json({ error: `The working day ends at ${isSaturday(start) ? '1:00 PM' : '5:00 PM'}. Choose an earlier leaving time.` }, { status: 400 });
    }
    if (to <= from) return NextResponse.json({ error: '"Back by" needs to be after "Leaving at".' }, { status: 400 });
    leaveTime = atLocal(start, from);
    returnTime = atLocal(start, to);
  } else {
    start = body?.start;
    end = type === 'half' ? body?.start : body?.end;
    half = type === 'half' ? body?.half : null;
    category = body?.category;
    if (!isYmd(start) || !isYmd(end)) {
      return NextResponse.json({ error: 'Choose the date(s) for your leave.' }, { status: 400 });
    }
    if (!['annual', 'casual'].includes(category)) {
      return NextResponse.json({ error: 'Choose annual or casual leave.' }, { status: 400 });
    }
    // Medical is casual leave for sickness. It uses casual days.
    medical = category === 'casual' && (body.medical === true || body.medical === 'true');
    if (medical && (!file || !file.size) && needsCertificate(await medicalCountFor(session.name, start))) {
      return NextResponse.json(
        { error: "You've already taken 3 medical leaves this year, so attach a medical certificate to send this." },
        { status: 400 }
      );
    }
    if (medical && file && file.size) {
      if (file.size > MAX_FILE) {
        return NextResponse.json({ error: 'That file is too large. Use a photo, or a PDF under 3 MB.' }, { status: 400 });
      }
      const data = Buffer.from(await file.arrayBuffer());
      const mime = sniff(data);
      if (!mime) return NextResponse.json({ error: 'Attach a photo (JPG or PNG) or a PDF.' }, { status: 400 });
      const name = String(file.name || 'certificate').replace(/[^\w.\- ]+/g, '_').slice(-80) || 'certificate';
      cert = { name, mime, data };
    }
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
  }

  const token = crypto.randomBytes(24).toString('hex');
  // The request and its certificate are saved together, or not at all.
  const insert = `INSERT INTO leave_requests
      (kind, leave_type, start_date, end_date, half, days, leave_category,
       employee_name, employee_email, leave_time, expected_return_time, reason, decision_token, certificate_name, medical, no_return)
     VALUES ('leave', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`;
  const { rows } = await query(
    cert
      ? `WITH r AS (${insert}),
              a AS (INSERT INTO leave_attachments (request_id, name, mime, size, data) SELECT id, $13, $16, $17, $18 FROM r)
         SELECT * FROM r`
      : insert,
    [
      type,
      start,
      end,
      half,
      days,
      category,
      session.name,
      session.email,
      leaveTime.toISOString(),
      returnTime.toISOString(),
      reason,
      token,
      cert ? cert.name : null,
      medical,
      noReturn,
      ...(cert ? [cert.mime, cert.data.length, cert.data] : []),
    ]
  );
  const row = rows[0];
  const d = describe(row);
  await pushNewRequest(row);

  try {
    // The manager's email shows the same balance line as the app (red when there aren't enough days).
    const balance = await balanceFor(row.employee_name, leaveYear(row.start_date));
    const medNote = row.medical ? medicalLine(await medicalCountFor(row.employee_name, row.start_date)) : null;
    await sendManagerApprovalEmail(row, balanceLine(row, balance), medNote);
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
