'use client';

import { useState } from 'react';
import { DownloadIcon } from '../../../components/Icons';

function lastDay(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${ym}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
}
function shift(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function monthName(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export default function ExportButton({ month, today }) {
  const current = today.slice(0, 7);
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState('viewed');
  const [from, setFrom] = useState(`${month}-01`);
  const [to, setTo] = useState(today);
  const [stepOut, setStepOut] = useState(true);
  const [leave, setLeave] = useState(true);

  const periods = [{ key: 'viewed', label: monthName(month), range: [`${month}-01`, lastDay(month)] }];
  if (month !== current) periods.push({ key: 'current', label: 'This month', range: [`${current}-01`, lastDay(current)] });
  if (month !== shift(current, -1)) periods.push({ key: 'last', label: 'Last month', range: [`${shift(current, -1)}-01`, lastDay(shift(current, -1))] });
  periods.push({ key: 'custom', label: 'Custom', range: [from, to] });

  const chosen = periods.find((p) => p.key === period) || periods[0];
  const [start, end] = chosen.range;
  const types = [stepOut && 'step_out', leave && 'leave'].filter(Boolean);
  const valid = types.length > 0 && start && end && start <= end;
  const url = `/api/manager/export?from=${start}&to=${end}&types=${types.join(',')}`;
  const fileName = start.endsWith('-01') && end === lastDay(start.slice(0, 7)) ? `methg-requests-${start.slice(0, 7)}.xlsx` : `methg-requests-${start}-to-${end}.xlsx`;

  return (
    <>
      <button type="button" className="xbtn" onClick={() => setOpen(true)}><DownloadIcon />Export</button>
      {open && (
        <>
          <div className="scrim" onClick={() => setOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="export-title">
            <span className="grab" />
            <h2 id="export-title">Export to Excel</h2>
            <div className="field">
              <span className="lbl">Period</span>
              <div className="chips">
                {periods.map((p) => (
                  <button key={p.key} type="button" className={period === p.key ? 'on' : ''} onClick={() => setPeriod(p.key)}>{p.label}</button>
                ))}
              </div>
            </div>
            {period === 'custom' && (
              <div className="two">
                <div className="field">
                  <label className="lbl" htmlFor="x-from">From</label>
                  <input id="x-from" className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div className="field">
                  <label className="lbl" htmlFor="x-to">To</label>
                  <input id="x-to" className="input" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>
            )}
            <div className="field">
              <span className="lbl">Include</span>
              <div className="ticks">
                <label className="tick-row"><input type="checkbox" checked={stepOut} onChange={(e) => setStepOut(e.target.checked)} />Step out</label>
                <label className="tick-row"><input type="checkbox" checked={leave} onChange={(e) => setLeave(e.target.checked)} />Leave</label>
              </div>
            </div>
            <div className="fname">{fileName}</div>
            {valid ? (
              <a className="btn blue" href={url} onClick={() => setTimeout(() => setOpen(false), 300)}>Download Excel file</a>
            ) : (
              <div className="note warn">Pick at least one type and a valid date range.</div>
            )}
            <p className="hint" style={{ marginTop: -6 }}>Opens in Excel, Numbers or Google Sheets.</p>
          </div>
        </>
      )}
    </>
  );
}
