import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/auth';
import { findEmployeeByUsername } from '../../../../../lib/employees';
import { saveProfile } from '../../../../../lib/profiles';
import { validYmd } from '../../../../../lib/staffDates';
import { localDate } from '../../../../../lib/time';

// Manager: set someone's joining date and birthday. Body: { joined: "2024-05-01" | "", birthday: "1998-08-08" | "" }.
export async function POST(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'manager') {
    return NextResponse.json({ error: "You don't have access to that." }, { status: 403 });
  }
  const { who } = await params;
  const person = findEmployeeByUsername(`${decodeURIComponent(who)}@methg`);
  if (!person) return NextResponse.json({ error: "We couldn't find that person." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const joined = body?.joined || null;
  const birthday = body?.birthday || null;
  if (joined && !validYmd(joined)) return NextResponse.json({ error: 'Choose a valid joining date.' }, { status: 400 });
  if (birthday && !validYmd(birthday)) return NextResponse.json({ error: 'Choose a valid birthday.' }, { status: 400 });
  if (birthday && (birthday > localDate() || birthday < '1900-01-01')) {
    return NextResponse.json({ error: 'That birthday is in the future. Check the year.' }, { status: 400 });
  }
  if (joined && joined < '1990-01-01') return NextResponse.json({ error: 'Check the joining year.' }, { status: 400 });

  await saveProfile(person.name, { joined, birthday });
  return NextResponse.json({ ok: true });
}
