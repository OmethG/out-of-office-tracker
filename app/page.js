'use client';

import { useState } from 'react';
import employees from '../config/employees.json';

function nowLocalInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const wrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7', fontFamily: '-apple-system, system-ui, sans-serif', padding: 16 };
const card = { background: '#fff', padding: '28px 28px', borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,.08)', width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column' };
const label = { fontSize: 13, fontWeight: 600, marginTop: 16, marginBottom: 6, color: '#333' };
const input = { padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, fontFamily: 'inherit' };
const button = { marginTop: 22, padding: '12px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' };

export default function Home() {
  const [employeeName, setEmployeeName] = useState('');
  const [leaveTime, setLeaveTime] = useState(nowLocalInput());
  const [expectedReturnTime, setExpectedReturnTime] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('submitting');
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName,
          leaveTime: new Date(leaveTime).toISOString(),
          expectedReturnTime: new Date(expectedReturnTime).toISOString(),
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setStatus('idle');
        return;
      }
      if (data.warning) setWarning(data.warning);
      setStatus('submitted');
    } catch (err) {
      setError('Network error. Please try again.');
      setStatus('idle');
    }
  }

  if (status === 'submitted') {
    return (
      <main style={wrap}>
        <div style={card}>
          <h1 style={{ fontSize: 20 }}>Request Submitted</h1>
          <p style={{ color: '#555' }}>Your manager has been notified and will review your request shortly.</p>
          {warning && <p style={{ color: '#b8860b', fontSize: 13 }}>{warning}</p>}
        </div>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <form onSubmit={handleSubmit} style={card}>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Out-of-Office Request</h1>
        <p style={{ color: '#666', fontSize: 13, marginTop: 0 }}>
          Please complete this form before leaving the office. Your manager will be notified for approval.
        </p>

        <label style={label}>Employee Name</label>
        <select required value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} style={input}>
          <option value="" disabled>Select your name</option>
          {employees.map((emp) => (
            <option key={emp.name} value={emp.name}>{emp.name}</option>
          ))}
        </select>

        <label style={label}>Departure Time</label>
        <input required type="datetime-local" value={leaveTime} onChange={(e) => setLeaveTime(e.target.value)} style={input} />

        <label style={label}>Expected Return Time</label>
        <input required type="datetime-local" value={expectedReturnTime} onChange={(e) => setExpectedReturnTime(e.target.value)} style={input} />

        <label style={label}>Reason for Leaving (2&ndash;3 sentences)</label>
        <textarea
          required
          maxLength={500}
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ ...input, resize: 'vertical' }}
          placeholder="e.g. Visiting the bank to resolve a company account issue. Expected to return after lunch."
        />

        {error && <p style={{ color: '#c0392b', fontSize: 13 }}>{error}</p>}

        <button type="submit" disabled={status === 'submitting'} style={button}>
          {status === 'submitting' ? 'Submitting...' : 'Submit for Approval'}
        </button>
      </form>
    </main>
  );
}
