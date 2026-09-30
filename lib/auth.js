import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, readSession } from './session';

// For server pages and route handlers.
export async function getSession() {
  const store = await cookies();
  return readSession(store.get(SESSION_COOKIE)?.value);
}

export async function requireSession(role) {
  const s = await getSession();
  if (!s) redirect('/login');
  if (role && s.role !== role) redirect(s.role === 'manager' ? '/manager' : '/');
  return s;
}
