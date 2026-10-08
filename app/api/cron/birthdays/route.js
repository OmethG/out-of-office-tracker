import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { getProfiles } from '../../../../lib/profiles';
import { notifyEveryoneExcept, notifyStaff } from '../../../../lib/push';
import { daysToBirthday } from '../../../../lib/staffDates';
import { localDate } from '../../../../lib/time';

export const dynamic = 'force-dynamic';

// Runs once a day around 8 AM Sri Lanka time (vercel.json "crons"). For each birthday today:
// the birthday person gets "Happy birthday", everyone else gets "Today is X's birthday".
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  }
  const today = localDate();
  const profiles = await getProfiles();
  const done = [];
  for (const [name, p] of Object.entries(profiles)) {
    if (!p.birthday || daysToBirthday(p.birthday, today) !== 0) continue;
    // Claim the day first, so a second run the same day sends nothing.
    const claimed = await query(
      'INSERT INTO birthday_pushes (day, name) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING name',
      [today, name]
    );
    if (claimed.rowCount === 0) continue;
    await notifyStaff(name, { title: `Happy birthday, ${name}!`, body: 'From everyone at MethG.', url: '/', tag: `bday-${today}-${name}` });
    await notifyEveryoneExcept(name, { title: `Today is ${name}'s birthday`, body: `Wish ${name} a happy birthday.`, url: '/staff', tag: `bday-${today}-${name}` });
    done.push(name);
  }
  return NextResponse.json({ ok: true, day: today, birthdays: done });
}
