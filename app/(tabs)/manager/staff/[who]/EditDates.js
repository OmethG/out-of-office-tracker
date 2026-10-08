'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Manager: change someone's joining date or birthday. Either can be left empty.
export default function EditDates({ who, joined, birthday }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [j, setJ] = useState(joined || '');
  const [b, setB] = useState(birthday || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/manager/staff/${encodeURIComponent(who)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joined: j, birthday: b }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save. Please try again.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="edit-dates" onClick={() => { setJ(joined || ''); setB(birthday || ''); setOpen(true); }}>
        Edit dates
      </button>
    );
  }
  return (
    <form className="card edit-box" onSubmit={save}>
      <label className="field" htmlFor="ed-joined">
        <span className="lbl">Joined</span>
        <input id="ed-joined" className="input" type="date" value={j} onChange={(e) => setJ(e.target.value)} />
      </label>
      <label className="field" htmlFor="ed-birthday">
        <span className="lbl">Birthday</span>
        <input id="ed-birthday" className="input" type="date" value={b} onChange={(e) => setB(e.target.value)} />
        <span className="hintline">Staff see the day and month only, never the year.</span>
      </label>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="two">
        <button type="button" className="btn ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
        <button type="submit" className="btn blue" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}
