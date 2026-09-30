'use client';

import Link from 'next/link';
import { CheckIcon } from './Icons';

export default function Done({ tone, summary, warning }) {
  return (
    <div className="done">
      <span className="tick" style={{ background: tone === 'lv' ? 'var(--fill-purple)' : 'var(--fill-blue)' }}><CheckIcon /></span>
      <h2>Request sent</h2>
      <p>{summary}</p>
      <p>Your manager has been notified. You&apos;ll get an email once it&apos;s approved or declined.</p>
      {warning && <div className="note warn">{warning}</div>}
      <Link href="/" className="btn ghost" style={{ marginTop: 8 }}>Back to home</Link>
    </div>
  );
}
