'use client';

import { useState } from 'react';

// Signing out also stops notifications on this phone, so the next person to sign in doesn't get yours.
async function stopNotifications() {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  if (!sub) return;
  await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
  await sub.unsubscribe();
}

export default function SignOut() {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    await stopNotifications().catch(() => {});
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    window.location.replace('/login');
  }
  return (
    <button type="button" className="btn danger" onClick={signOut} disabled={busy}>
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
