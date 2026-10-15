'use client';

import { useEffect } from 'react';

function keyBytes(b64) {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

// Runs quietly on every signed-in screen. Once notifications are allowed on a phone they stay on:
// this links the phone to whoever is signed in now (after signing out and back in, or a new person
// signing in), and turns them back on by itself if the phone had allowed them before.
export default function PushSync({ publicKey }) {
  useEffect(() => {
    if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
        await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) });
      } catch {
        // Some phones only allow turning them on from a tap; Account → Notifications still works.
      }
    })();
  }, [publicKey]);
  return null;
}
