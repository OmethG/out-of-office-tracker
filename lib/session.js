import { findEmployeeByUsername } from './employees';

// Signed-in state lives in one signed cookie. Works in proxy.js and on the server.
export const SESSION_COOKIE = 'methg_session';
const LONG = 60 * 60 * 24 * 180; // "Keep me signed in": 180 days
const SHORT = 60 * 60 * 12; // otherwise the token itself expires after 12 hours

function secret() {
  const s = process.env.SESSION_SECRET || process.env.DATABASE_URL;
  if (!s) throw new Error('Set SESSION_SECRET (or DATABASE_URL) to sign sessions.');
  return s;
}

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function hmac(data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return b64url(new Uint8Array(sig));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// role: 'staff' | 'manager'. Returns { value, maxAge } for the cookie.
export async function createSession({ username, role, remember }) {
  const maxAge = remember ? LONG : SHORT;
  const payload = b64url(
    new TextEncoder().encode(
      JSON.stringify({ u: username, r: role, exp: Math.floor(Date.now() / 1000) + maxAge })
    )
  );
  return { value: `${payload}.${await hmac(payload)}`, maxAge: remember ? maxAge : undefined };
}

// Returns { username, role, name, email } or null.
export async function readSession(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  try {
    if (!safeEqual(sig, await hmac(payload))) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    if (!data.exp || data.exp < Date.now() / 1000) return null;
    if (data.r === 'manager') {
      const managerUser = (process.env.MANAGER_USERNAME || '').trim().toLowerCase();
      if (!managerUser || data.u !== managerUser) return null;
      return { username: data.u, role: 'manager', name: 'Manager', email: data.u };
    }
    if (data.r === 'staff') {
      // Look the person up each time, so a renamed or removed employee is handled.
      const emp = findEmployeeByUsername(data.u);
      if (!emp) return null;
      return { username: data.u, role: 'staff', name: emp.name, email: emp.email || null };
    }
    return null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(maxAge ? { maxAge } : {}),
  };
}
