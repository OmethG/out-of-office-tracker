import { NextResponse } from 'next/server';

export function proxy(req) {
  const username = process.env.MANAGER_USERNAME;
  const password = process.env.MANAGER_PASSWORD;

  if (!username || !password) {
    return new NextResponse(
      'Manager login is not configured. Set MANAGER_USERNAME and MANAGER_PASSWORD.',
      { status: 500 }
    );
  }

  const auth = req.headers.get('authorization');

  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      let decoded = '';
      try {
        decoded = atob(encoded);
      } catch {
        decoded = '';
      }
      const separatorIndex = decoded.indexOf(':');
      const user = decoded.slice(0, separatorIndex);
      const pass = decoded.slice(separatorIndex + 1);
      if (user === username && pass === password) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Manager area"' },
  });
}

export const config = {
  matcher: ['/requests', '/requests/:path*', '/api/requests/:path+'],
};
