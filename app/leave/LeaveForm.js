'use client';

import { useState } from 'react';
import { HALF_DAY, addDays, dateLabel, daysLabel, isSaturday, isSunday, nextWorkingDay, workingDays } from '../../lib/time';

function hasSaturday(start, end) {
  for (let d = start, i = 0; d <= end && i < 400; d = addDays(d, 1), i++) if (isSaturday(d)) return true;
  return false;
}
import Done from '../components/Done';

export default function LeaveForm({ today }) {
  const first = nextWorkingDay(today);
  const [type, setType] = useState('full');
  const [start, setStart] = useState(first);
  const [end, setEnd] = useState(first);
  const [date, setDate] = useState(first);
  const [half, setHalf] = useState('morning');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  function changeStart(v) {
    setStart(v);
    if (!end || end < v) setEnd(v);
  }

  function changeDate(v) {
    setDate(v);
    if (isSaturday(v)) setHalf('morning');
  }

  const saturdayHalf = type === 'half' && date && isSaturday(date);
  let summary = null;
  let problem = null;
  let aside = null;
  if (type === 'full' && start && end) {
    if (end < start) problem = 'The last day is before the first day.';
    else {
      const n = workingDays(start, end);
      if (n === 0) problem = 'Sunday is already a day off. Choose a working day.';
      else {
        summary = `${daysLabel(n)} off · back ${dateLabel(nextWorkingDay(end)).text}`;
        if (hasSaturday(start, end)) aside = 'Saturday counts as half a day, since work finishes at 1 PM.';
      }
    }
  }
  if (type === 'half' && date) {
    if (isSunday(date)) problem = 'Sunday is already a day off. Choose a working day.';
    else summary = `${dateLabel(date).text} · ${HALF_DAY[half].text}`;
    if (saturdayHalf) aside = 'Saturdays finish at 1 PM, so only the morning can be taken.';
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      const body = type === 'full' ? { type, start, end, reason } : { type, start: date, end: date, half, reason };
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  if (done) return <Done tone="lv" summary={`${done.title} · ${done.when}`} warning={done.warning} />;

  return (
    <form className="form" onSubmit={submit}>
      <div className="seg" role="radiogroup" aria-label="Leave type">
        <button type="button" role="radio" aria-checked={type === 'full'} className={type === 'full' ? 'on' : ''} onClick={() => setType('full')}>Full day</button>
        <button type="button" role="radio" aria-checked={type === 'half'} className={type === 'half' ? 'on' : ''} onClick={() => setType('half')}>Half day</button>
      </div>

      {type === 'full' ? (
        <div className="two">
          <div className="field">
            <label className="lbl" htmlFor="from">First day</label>
            <input id="from" className="input" type="date" value={start} onChange={(e) => changeStart(e.target.value)} required />
          </div>
          <div className="field">
            <label className="lbl" htmlFor="to">Last day</label>
            <input id="to" className="input" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} required />
          </div>
        </div>
      ) : (
        <>
          <div className="field">
            <label className="lbl" htmlFor="date">Date</label>
            <input id="date" className="input" type="date" value={date} onChange={(e) => changeDate(e.target.value)} required />
          </div>
          <div className="field" role="radiogroup" aria-label="Which half of the day">
            <span className="lbl">Which half?</span>
            <div className="halves">
              {Object.entries(HALF_DAY).map(([key, h]) => {
                const off = saturdayHalf && key === 'afternoon';
                return (
                  <label key={key} className={`half ${half === key ? 'on' : ''} ${off ? 'off' : ''}`}>
                    <input type="radio" name="half" value={key} checked={half === key} disabled={off} onChange={() => setHalf(key)} />
                    <b>{h.label}</b>
                    <small>{off ? 'Not on Saturdays' : h.text}</small>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}

      {problem ? <div className="note warn">{problem}</div> : summary && <div className="note lv">{summary}</div>}
      {!problem && aside && <p className="count" style={{ textAlign: 'left', marginTop: -8 }}>{aside}</p>}

      <div className="field">
        <label className="lbl" htmlFor="reason">Reason</label>
        <textarea
          id="reason"
          className="input"
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Attending a family wedding in Kandy."
          required
        />
        <div className="count">{reason.length}/500</div>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      <button className="btn purple" disabled={busy}>{busy ? 'Sending…' : 'Submit for approval'}</button>
    </form>
  );
}
