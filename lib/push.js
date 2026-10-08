import webpush from 'web-push';
import { query } from './db';

// Phone notifications (Web Push). Needs VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in the environment;
// without them nothing is sent and the rest of the app carries on as normal.
let ready = null;
function setup() {
  if (ready !== null) return ready;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (ready = false);
  webpush.setVapidDetails(`mailto:${process.env.MANAGER_EMAIL || 'pro@methg.com'}`, pub, priv);
  return (ready = true);
}

export const pushConfigured = () => setup();
export const publicKey = () => process.env.VAPID_PUBLIC_KEY || null;

// One row per phone. A person can have several phones; the manager is stored with role 'manager'.
export async function saveSubscription(session, sub) {
  await query(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth, role, name)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
       role = EXCLUDED.role, name = EXCLUDED.name, created_at = now()`,
    [sub.endpoint, sub.keys.p256dh, sub.keys.auth, session.role, session.role === 'manager' ? null : session.name]
  );
}

export async function removeSubscription(endpoint) {
  await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
}

// payload: { title, body, url, tag }
async function sendRows(rows, payload) {
  if (!setup() || rows.length === 0) return 0;
  const data = JSON.stringify(payload);
  let sent = 0;
  await Promise.all(
    rows.map(async (r) => {
      try {
        await webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, data, { TTL: 60 * 60 * 12 });
        sent++;
      } catch (err) {
        // 404/410: the phone turned notifications off or the app was removed. Forget it.
        if (err.statusCode === 404 || err.statusCode === 410) await removeSubscription(r.endpoint);
        else console.error('Push failed', err.statusCode || err.message);
      }
    })
  );
  return sent;
}

// Never let a notification problem break the request that triggered it.
async function safe(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error('Push error', err);
    return 0;
  }
}

export const notifyManager = (payload) =>
  safe(async () => sendRows((await query("SELECT * FROM push_subscriptions WHERE role = 'manager'")).rows, payload));

export const notifyStaff = (name, payload) =>
  safe(async () => sendRows((await query("SELECT * FROM push_subscriptions WHERE role = 'staff' AND name = $1", [name])).rows, payload));

// Everyone except one person (the birthday person gets their own message).
export const notifyEveryoneExcept = (name, payload) =>
  safe(async () => sendRows((await query('SELECT * FROM push_subscriptions WHERE name IS DISTINCT FROM $1', [name])).rows, payload));
