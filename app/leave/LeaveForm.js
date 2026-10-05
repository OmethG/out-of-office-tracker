'use client';

import { useRef, useState } from 'react';
import { HALF_DAY, addDays, daysLabel, durationLabel, isSaturday, isSunday, nextWorkingDay, workingDays } from '../../lib/time';
import { fmtDays } from '../../lib/leaveRules';

function hasSaturday(start, end) {
  for (let d = start, i = 0; d <= end && i < 400; d = addDays(d, 1), i++) if (isSaturday(d)) return true;
  return false;
}
import Done from '../components/Done';

// "14:05" now in Sri Lanka, rounded up to the next 5 minutes, plus an offset in minutes.
function colomboTime(plusMinutes = 0) {
  const d = new Date(Date.now() + plusMinutes * 60000);
  const p = {};
  for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d)) p[x.type] = x.value;
  let mins = Number(p.hour) * 60 + Math.ceil(Number(p.minute) / 5) * 5;
  mins = Math.min(mins, 23 * 60 + 55);
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const minutesOf = (t) => (/^\d{2}:\d{2}$/.test(t) ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) : NaN);
const CATS = [
  { key: 'annual', label: 'Annual' },
  { key: 'casual', label: 'Casual' },
  { key: 'medical', label: 'Medical' },
];

const MAX_PDF = 3 * 1024 * 1024;
const kb = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

// Phone photos are several MB. Shrink them in the browser so they send quickly and are still easy to read.
async function shrinkPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    if (!blob) throw new Error('no blob');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
const TABS = [
  { key: 'full', label: 'Full day' },
  { key: 'half', label: 'Half day' },
  { key: 'short', label: 'Short leave' },
];

export default function LeaveForm({ today, balance }) {
  const first = nextWorkingDay(today);
  const [type, setType] = useState('full');
  const [category, setCategory] = useState('annual');
  const [shortDate, setShortDate] = useState(today);
  const [from, setFrom] = useState(() => colomboTime(0));
  const [to, setTo] = useState(() => colomboTime(90));
  const [start, setStart] = useState(first);
  const [end, setEnd] = useState(first);
  const [date, setDate] = useState(first);
  const [half, setHalf] = useState('morning');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [cert, setCert] = useState(null); // { blob, name, size, preview }
  const [certBusy, setCertBusy] = useState(false);
  const [certError, setCertError] = useState('');
  const fileInput = useRef(null);

  async function pickCertificate(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCertError('');
    setCertBusy(true);
    try {
      if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        if (file.size > MAX_PDF) throw new Error('That PDF is over 3 MB. Take a photo of the certificate instead.');
        setCert({ blob: file, name: file.name, size: file.size, preview: null });
      } else {
        const blob = await shrinkPhoto(file).catch(() => {
          throw new Error("Couldn't read that photo. Try taking a new one.");
        });
        const name = `${(file.name || 'certificate').replace(/\.[^.]+$/, '') || 'certificate'}.jpg`;
        setCert((old) => {
          if (old?.preview) URL.revokeObjectURL(old.preview);
          return { blob, name, size: blob.size, preview: URL.createObjectURL(blob) };
        });
      }
    } catch (err) {
      setCertError(err.message);
    } finally {
      setCertBusy(false);
    }
  }

  function removeCertificate() {
    if (cert?.preview) URL.revokeObjectURL(cert.preview);
    setCert(null);
  }

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
        if (hasSaturday(start, end)) aside = 'Saturday counts as half a day, since work finishes at 1 PM.';
      }
    }
  }
  if (type === 'half' && date) {
    if (isSunday(date)) problem = 'Sunday is already a day off. Choose a working day.';
    if (saturdayHalf) aside = 'Saturdays finish at 1 PM, so only the morning can be taken.';
  }

  // Short leave: just the time away.
  if (type === 'short') {
    const a = minutesOf(from);
    const b = minutesOf(to);
    if (!shortDate) problem = 'Choose the date.';
    else if (isNaN(a) || isNaN(b)) problem = 'Choose the leaving and back-by times.';
    else if (b <= a) problem = '"Back by" needs to be after "Leaving at".';
    else summary = `${durationLabel((b - a) * 60000)}. Short leave is recorded but doesn't use your 21 days.`;
  }

  // Annual or casual: what's left now (approved leave), less anything already waiting, less this request.
  let need = null;
  if (!problem && type === 'full' && start && end && end >= start) need = workingDays(start, end);
  if (!problem && type === 'half' && date) need = 0.5;
  const medical = type !== 'short' && category === 'medical';
  const b = balance[category];
  const available = medical ? Infinity : b.left - b.pending;
  const after = need === null || medical ? null : available - need;
  const over = after !== null && after < 0;
  const catWord = category;
  const missingCert = medical && !cert;

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (problem) {
      setError(problem);
      return;
    }
    if (!reason.trim()) {
      setError('Please add a reason.');
      return;
    }
    if (missingCert) {
      setError('Attach a medical certificate or other proof to send this.');
      return;
    }
    setBusy(true);
    try {
      let body;
      if (type === 'full') body = { type, category, start, end, reason };
      else if (type === 'half') body = { type, category, start: date, end: date, half, reason };
      else body = { type, date: shortDate, from, to, reason };
      let res;
      if (medical) {
        // The certificate travels with the request, so one can't be saved without the other.
        const form = new FormData();
        for (const [k, v] of Object.entries(body)) form.append(k, v);
        form.append('certificate', cert.blob, cert.name);
        res = await fetch('/api/leave', { method: 'POST', body: form });
      } else {
        res = await fetch('/api/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
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
      <div className="seg three" role="radiogroup" aria-label="Kind of leave">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="radio" aria-checked={type === t.key} className={type === t.key ? 'on' : ''} onClick={() => { setType(t.key); setError(''); }}>
            {t.label}
          </button>
        ))}
      </div>

      {type !== 'short' && (
        <div className="field" role="radiogroup" aria-label="Type of leave">
          <span className="lbl">Type of leave</span>
          <div className="halves three">
            {CATS.map((c) => {
              const cb = balance[c.key];
              const noLimit = c.key === 'medical';
              return (
                <label key={c.key} className={`half ${category === c.key ? 'on' : ''}`}>
                  <input type="radio" name="category" value={c.key} checked={category === c.key} onChange={() => { setCategory(c.key); setError(''); }} />
                  <b>{c.label}</b>
                  <small className={!noLimit && cb.left <= 0 ? 'out' : ''}>
                    {noLimit ? 'No limit' : `${fmtDays(cb.left)} left`}
                    {cb.pending > 0 && <span>{fmtDays(cb.pending)} waiting</span>}
                  </small>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {type === 'short' ? (
        <>
          <div className="field">
            <label className="lbl" htmlFor="sdate">Date</label>
            <input id="sdate" className="input" type="date" value={shortDate} onChange={(e) => setShortDate(e.target.value)} required />
          </div>
          <div className="two">
            <div className="field">
              <label className="lbl" htmlFor="sfrom">Leaving at</label>
              <input id="sfrom" className="input" type="time" value={from} onChange={(e) => setFrom(e.target.value)} required />
            </div>
            <div className="field">
              <label className="lbl" htmlFor="sto">Back by</label>
              <input id="sto" className="input" type="time" value={to} onChange={(e) => setTo(e.target.value)} required />
            </div>
          </div>
        </>
      ) : type === 'full' ? (
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

      {problem ? (
        <div className="note warn">{problem}</div>
      ) : type === 'short' ? (
        summary && <div className="note so">{summary}</div>
      ) : (
        need !== null && (
          medical ? (
            <div className="note lv">This doesn&apos;t use your 21 days.</div>
          ) : (
            <div className={`note ${over ? 'bad' : 'lv'}`}>
              {over
                ? `You only have ${fmtDays(Math.max(available, 0))} ${catWord} ${available === 1 ? 'day' : 'days'} left${b.pending > 0 ? " after what's already waiting" : ''}. You can still send this, and your manager will see that it's over.`
                : `${cap(daysLabel(need))} of ${catWord} leave. You'll have ${fmtDays(after)} ${catWord} ${after === 1 ? 'day' : 'days'} left.`}
            </div>
          )
        )
      )}
      {!problem && aside && <p className="count" style={{ textAlign: 'left', marginTop: -8 }}>{aside}</p>}

      {medical && (
        <div className="field">
          <span className="lbl">
            Medical certificate or proof <i className={`reqtag ${cert ? 'ok' : ''}`}>{cert ? 'Attached' : 'Required'}</i>
          </span>
          <input ref={fileInput} id="certificate" type="file" accept="image/*,application/pdf" onChange={pickCertificate} hidden />
          {cert ? (
            <div className="att">
              {cert.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cert.preview} alt="" />
              ) : (
                <span className="pdf">PDF</span>
              )}
              <span>
                <b>{cert.name}</b>
                <small>{cert.preview ? 'Photo' : 'PDF'} · {kb(cert.size)}</small>
              </span>
              <button type="button" onClick={removeCertificate} disabled={busy}>Remove</button>
            </div>
          ) : (
            <button type="button" className="drop" onClick={() => fileInput.current?.click()} disabled={certBusy}>
              <b>{certBusy ? 'Reading the file…' : '＋ Take a photo or choose a file'}</b>
              <small>Certificate, prescription, clinic or hospital receipt, or lab report. Photo or PDF.</small>
            </button>
          )}
          {certError && <div className="error" role="alert">{certError}</div>}
        </div>
      )}

      <div className="field">
        <label className="lbl" htmlFor="reason">Reason <i className="reqtag">Required</i></label>
        <textarea
          id="reason"
          className="input"
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={type === 'short' ? 'e.g. Bank appointment for a housing loan.' : medical ? 'e.g. Viral fever, doctor advised two days of rest.' : 'e.g. Attending a family wedding in Kandy.'}
          required
        />
        <div className="count">{reason.length}/500</div>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      <button className="btn purple" disabled={busy || missingCert}>{busy ? 'Sending…' : 'Submit for approval'}</button>
      {missingCert && <p className="whyoff">Attach a certificate or proof to send this.</p>}
    </form>
  );
}
