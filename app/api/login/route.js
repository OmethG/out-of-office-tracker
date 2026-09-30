import { NextResponse } from 'next/server';
import { findEmployeeByLogin } from '../../../lib/employees';
import { SESSION_COOKIE, createSession, sessionCookieOptions } from '../../../lib/session';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const remember = body.remember !== false;

  if (!username || !password) {
    return NextResponse.json({ error: 'Enter your username and password.' }, { status: 400 });
  }

  const managerUser = (process.env.MANAGER_USERNAME || '').trim().toLowerCase();
  let role = null;
  if (managerUser && username === managerUser && password === process.env.MANAGER_PASSWORD) {
    role = 'manager';
  } else if (findEmployeeByLogin(username, password)) {
    role = 'staff';
  }

  if (!role) {
    return NextResponse.json({ error: "That username and password don't match. Check them and try again." }, { status: 401 });
  }

  const { value, maxAge } = await createSession({ username, role, remember });
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, value, sessionCookieOptions(maxAge));
  return res;
}
