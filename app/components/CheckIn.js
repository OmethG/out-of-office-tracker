'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// "15:04" right now in Sri Lanka, whatever timezone the phone is set to.
function nowInColombo() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date());
}

// The check-in line under a step out (green when back, red when not), plus the "I'm back" button.
export default function CheckIn({ item }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function start() {
    setTime(nowInColombo());
    setError('');
    setOpen(true);
  }

  async function confirm() {
    if (!time) return setError('Choose the time you got back.');
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/requests/${item.id}/back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save that. Please try again.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {item.back && <span className={`backat ${item.back.tone}`}>{item.back.label}</span>}
      {item.canCheckIn && !open && (
        <button type="button" className="back-btn" onClick={start}>I&apos;m back</button>
      )}
      {item.canCheckIn && open && (
        <div className="checkin">
          <label htmlFor={`back-${item.id}`}>What time did you get back?</label>
          <input
            id={`back-${item.id}`}
            className="input"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={busy}
          />
          <span className="hint">Change it if you forgot to tap when you arrived.</span>
          {error && <div className="error" role="alert">{error}</div>}
          <div className="acts">
            <button type="button" className="btn ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
            <button type="button" className="btn blue" onClick={confirm} disabled={busy}>{busy ? 'Saving…' : 'Confirm'}</button>
          </div>
        </div>
      )}
    </>
  );
}
