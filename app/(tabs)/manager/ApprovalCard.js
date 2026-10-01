'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApprovalCard({ item }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const leave = item.kind === 'leave';

  async function act(action) {
    setBusy(action);
    setError('');
    try {
      const res = await fetch('/api/manager/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 409) {
        setError(data.error || 'Something went wrong. Please try again.');
        setBusy(null);
        return;
      }
      setResult(data.status);
      setTimeout(() => router.refresh(), 900);
    } catch {
      setError('No connection. Check your internet and try again.');
      setBusy(null);
    }
  }

  return (
    <div className="req">
      <div className="who">
        <span className={`av ${leave ? 'lv' : ''}`}>{item.name.charAt(0).toUpperCase()}</span>
        <b>{item.name}</b>
        <span className="kind">{item.title}</span>
      </div>
      <div className="when">{item.when}</div>
      <p>{item.reason}</p>
      {item.balance && <span className={`use ${item.balance.tone}`}>{item.balance.text}</span>}
      <div className="meta">Requested {item.requestedAt}</div>
      {error && <div className="error" role="alert">{error}</div>}
      {result ? (
        <div className={`note ${result === 'approved' ? 'so' : 'warn'}`} role="status">
          {result === 'approved' ? 'Approved' : 'Declined'}. {item.name} will get an email.
        </div>
      ) : (
        <div className="acts">
          <button type="button" className="no" onClick={() => act('decline')} disabled={!!busy}>
            {busy === 'decline' ? 'Declining…' : 'Decline'}
          </button>
          <button type="button" className="yes" onClick={() => act('approve')} disabled={!!busy}>
            {busy === 'approve' ? 'Approving…' : 'Approve'}
          </button>
        </div>
      )}
    </div>
  );
}
