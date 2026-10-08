import { NextResponse } from 'next/server';
import { SESSION_COOKIE, readSession } from './lib/session';

const STAFF_PATHS = ['/step-out', '/leave', '/requests', '/api/requests', '/api/leave'];
const isUnder = (pathname, base) => pathname === base || pathname.startsWith(base + '/');

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');
  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  const home = session?.role === 'manager' ? '/manager' : '/';

  // Open to everyone: the sign-in page, and the Approve/Decline links in manager emails.
  if (pathname === '/login') {
    return session ? NextResponse.redirect(new URL(home, req.url)) : NextResponse.next();
  }
  // The daily birthday job checks its own secret.
  if (pathname === '/api/login' || pathname === '/api/logout' || isUnder(pathname, '/api/decision') || isUnder(pathname, '/api/cron')) {
    return NextResponse.next();
  }

  if (!session) {
    if (isApi) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const managerArea = isUnder(pathname, '/manager') || isUnder(pathname, '/api/manager');
  const staffArea = STAFF_PATHS.some((p) => isUnder(pathname, p));

  if ((managerArea && session.role !== 'manager') || (staffArea && session.role !== 'staff')) {
    if (isApi) return NextResponse.json({ error: "You don't have access to that." }, { status: 403 });
    return NextResponse.redirect(new URL(home, req.url));
  }
  if (pathname === '/' && session.role === 'manager') {
    return NextResponse.redirect(new URL('/manager', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/|icons/|brand/|sw.js|manifest.webmanifest|icon.png|apple-icon.png|favicon.ico|robots.txt).*)',
  ],
};
