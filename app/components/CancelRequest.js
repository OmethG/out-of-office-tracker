'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// "Cancel request" on the staff Requests tab: one confirmation, then the request is marked Cancelled.
export default function CancelRequest({ item }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const approved = item.status === 'approved';
  const leave = item.kind === 'leave';
  const noun = leave ? 'leave' : 'step out';

  let effect = "It will be taken off your manager's list.";
  if (approved) {
    const days = item.days && ['annual', 'casual'].includes(item.category)
      ? ` and ${item.days === 0.5 ? 'the half day goes' : item.days === 1 ? 'the day goes' : `the ${item.days} days go`} back to your ${item.category} leave`
      : '';
    effect = `Your manager will be told${days}.`;
  }

  async function cancel() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/requests/${item.id}/cancel`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't cancel it. Please try again.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (!open) {
    return <button type="button" className="cancel-link" onClick={() => setOpen(true)}>Cancel request</button>;
  }
  return (
    <div className="cancel-box">
      <b>Cancel this {approved ? noun : 'request'}?</b>
      <span>{effect} This can&apos;t be undone.</span>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="acts">
        <button type="button" className="btn ghost" onClick={() => setOpen(false)} disabled={busy}>Keep it</button>
        <button type="button" className="btn danger" onClick={cancel} disabled={busy}>{busy ? 'Cancelling…' : approved ? `Cancel ${noun}` : 'Cancel request'}</button>
      </div>
    </div>
  );
}
