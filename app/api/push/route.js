import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/auth';
import { removeSubscription, saveSubscription } from '../../../lib/push';

const valid = (s) =>
  s && typeof s.endpoint === 'string' && /^https:\/\//.test(s.endpoint) && s.endpoint.length < 1000 &&
  typeof s.keys?.p256dh === 'string' && typeof s.keys?.auth === 'string';

// Turn notifications on for this phone. Body: the PushSubscription from the browser.
export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  const sub = await req.json().catch(() => null);
  if (!valid(sub)) return NextResponse.json({ error: "Couldn't turn on notifications. Please try again." }, { status: 400 });
  await saveSubscription(session, sub);
  return NextResponse.json({ ok: true });
}

// Turn them off for this phone. Body: { endpoint }.
export async function DELETE(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (typeof body?.endpoint === 'string') await removeSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
