'use client';

import { useMemo, useState } from 'react';
import { LockIcon } from '../components/Icons';
import Done from '../components/Done';

// "2026-09-30T14:30" in the phone's own time, rounded up to the next 5 minutes.
function localInput(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function duration(ms) {
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ') || '0 min';
}

export default function StepOutForm({ name }) {
  const [leaveAt, setLeaveAt] = useState(() => localInput(Date.now()));
  const [backBy, setBackBy] = useState(() => localInput(Date.now() + 90 * 60000));
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const away = useMemo(() => {
    const a = new Date(leaveAt).getTime();
    const b = new Date(backBy).getTime();
    if (isNaN(a) || isNaN(b)) return null;
    return b - a;
  }, [leaveAt, backBy]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (away === null || away <= 0) {
      setError('"Back by" needs to be after "Leaving at".');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveTime: new Date(leaveAt).toISOString(),
          expectedReturnTime: new Date(backBy).toISOString(),
          reason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
      setDone(data);
    } catch {
      setError('No connection. Check your internet and try again.');
      setBusy(false);
    }
  }

  if (done) return <Done tone="so" summary={`Step out · ${done.when}`} warning={done.warning} />;

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <span className="lbl">Employee</span>
        <div className="input locked">{name}<LockIcon /></div>
      </div>
      <div className="field">
        <label className="lbl" htmlFor="leave-at">Leaving at</label>
        <input id="leave-at" className="input" type="datetime-local" value={leaveAt} onChange={(e) => setLeaveAt(e.target.value)} required />
      </div>
      <div className="field">
        <label className="lbl" htmlFor="back-by">Back by</label>
        <input id="back-by" className="input" type="datetime-local" value={backBy} onChange={(e) => setBackBy(e.target.value)} required />
      </div>
      {away !== null && away > 0 && <div className="note so">Away for {duration(away)}</div>}
      <div className="field">
        <label className="lbl" htmlFor="reason">Reason</label>
        <textarea
          id="reason"
          className="input"
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Visiting the bank to sort out a company account. Back after lunch."
          required
        />
        <div className="count">{reason.length}/500</div>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      <button className="btn blue" disabled={busy}>{busy ? 'Sending…' : 'Submit for approval'}</button>
    </form>
  );
}
