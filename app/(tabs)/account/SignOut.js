'use client';

import { useState } from 'react';

// Notifications stay on for this phone after signing out. Whoever signs in next on it gets them instead.
export default function SignOut() {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    window.location.replace('/login');
  }
  return (
    <button type="button" className="btn danger" onClick={signOut} disabled={busy}>
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
