'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HistoryItem({ item }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/manager/requests/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Couldn't delete it. Please try again.");
      setBusy(false);
    }
  }

  return (
    <details className={`hrow ${item.status === 'cancelled' ? 'gone' : ''}`}>
      <summary className="row">
        <i className={`tm ${item.kind === 'leave' ? 'lv' : 'so'}`} aria-hidden="true" />
        <b>{item.name} · {item.title}</b>
        <span className={`pill ${item.status}`}>{item.statusLabel}</span>
        <small>{item.when}</small>
        {item.back && <span className={`backat ${item.back.tone}`}>{item.back.label}</span>}
      </summary>
      <div className="more">
        <p>{item.reason}</p>
        {item.certificate && <Link href={`/certificate/${item.id}`} className="linkbtn cert">View medical certificate ›</Link>}
        <span className="meta">
          Requested {item.requestedAt}
          {item.status === 'cancelled'
            ? ` · Cancelled by ${item.name}${item.cancelledAt ? ` ${item.cancelledAt}` : ''}`
            : item.decidedAt ? ` · ${item.statusLabel} ${item.decidedAt}` : ''}
        </span>
        {error && <div className="error" role="alert">{error}</div>}
        {confirming ? (
          <div className="confirm">
            Delete this request for good?
            <button type="button" className="del" onClick={remove} disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</button>
            <button type="button" className="keep" onClick={() => setConfirming(false)} disabled={busy}>Keep it</button>
          </div>
        ) : (
          <button type="button" className="linkbtn" onClick={() => setConfirming(true)}>Delete request</button>
        )}
      </div>
    </details>
  );
}
