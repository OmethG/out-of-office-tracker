'use client';

import { useEffect, useState } from 'react';
import { BellIcon } from './Icons';

function keyBytes(b64) {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

const supported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

async function sendToServer(sub) {
  const res = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't turn on notifications. Please try again.");
}

// Account: turn phone notifications on or off for this phone.
export default function Notifications({ publicKey }) {
  const [state, setState] = useState('loading'); // loading | ios-browser | unsupported | blocked | off | on
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!supported()) return setState(isIos() && !standalone() ? 'ios-browser' : 'unsupported');
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        const sub = await reg.pushManager.getSubscription();
        if (Notification.permission === 'denied') return setState('blocked');
        if (sub) {
          await sendToServer(sub.toJSON()).catch(() => {}); // keeps the phone linked to whoever is signed in
          return setState('on');
        }
        setState('off');
      } catch {
        setState('unsupported');
      }
    })();
  }, []);

  async function turnOn() {
    setBusy(true);
    setError('');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState(perm === 'denied' ? 'blocked' : 'off');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      await sendToServer(sub.toJSON());
      setState('on');
    } catch (err) {
      setError(err.message || "Couldn't turn on notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setError('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState('off');
    } catch {
      setError("Couldn't turn them off. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const line = {
    loading: 'Checking…',
    'ios-browser': 'Open MethG Staff from its home-screen icon to turn these on.',
    unsupported: "This phone's browser can't show notifications.",
    blocked: "Blocked on this phone. Allow them for MethG Staff in your phone's Settings.",
    off: 'Off on this phone',
    on: 'On for this phone',
  }[state];

  return (
    <div className="notif">
      <span className={`ni ${state === 'on' ? 'on' : ''}`}><BellIcon /></span>
      <b>Notifications</b>
      <small>{line}</small>
      {state === 'off' && (
        <button type="button" className="notif-btn" onClick={turnOn} disabled={busy}>{busy ? 'Turning on…' : 'Turn on'}</button>
      )}
      {state === 'on' && (
        <button type="button" className="notif-off" onClick={turnOff} disabled={busy}>{busy ? 'Turning off…' : 'Turn off'}</button>
      )}
      {error && <div className="error" role="alert">{error}</div>}
    </div>
  );
}
