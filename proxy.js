import { NextResponse } from 'next/server';
import { findEmployeeByLogin } from './lib/employees';

function readBasicAuth(req) {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic' || !encoded) return null;
  let decoded = '';
  try {
    decoded = atob(encoded);
  } catch {
    return null;
  }
  const i = decoded.indexOf(':');
  if (i === -1) return null;
  return { username: decoded.slice(0, i), password: decoded.slice(i + 1) };
}

function askForLogin(realm) {
  return new NextResponse('Login required.', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${realm}"` },
  });
}

export function proxy(req) {
  const { pathname } = req.nextUrl;
  const creds = readBasicAuth(req);

  // Manager-only: the requests history page, CSV export, and delete.
  const isManagerArea =
    pathname === '/requests' ||
    pathname.startsWith('/requests/') ||
    pathname.startsWith('/api/requests/');

  if (isManagerArea) {
    const username = process.env.MANAGER_USERNAME;
    const password = process.env.MANAGER_PASSWORD;
    if (!username || !password) {
      return new NextResponse(
        'Manager login is not configured. Set MANAGER_USERNAME and MANAGER_PASSWORD.',
        { status: 500 }
      );
    }
    if (creds && creds.username === username && creds.password === password) {
      return NextResponse.next();
    }
    return askForLogin('Manager area');
  }

  // Staff: the request form and submitting it. Each person logs in as themselves,
  // and the server attaches their name to the request so nobody can submit as someone else.
  const employee = creds && findEmployeeByLogin(creds.username, creds.password);
  if (!employee) {
    return askForLogin('Staff area');
  }
  const headers = new Headers(req.headers);
  headers.set('x-employee-name', employee.name);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/', '/api/requests', '/requests', '/requests/:path*', '/api/requests/:path+'],
};
