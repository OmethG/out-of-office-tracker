import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import TabBar from './TabBar';
import CheckIn from './CheckIn';
import CancelRequest from './CancelRequest';
import { BackIcon } from './Icons';

export function TopBar({ session }) {
  return (
    <header className="topbar">
      <span className="mk"><img src="/brand/mark.png" alt="" /></span>
      <span>MethG Staff</span>
      {session.role === 'manager' && <span className="role-tag">Manager</span>}
      <span className="spacer" />
      <ThemeToggle />
      <Link href="/account" className="avatar" aria-label="Your account">
        {session.role === 'manager' ? 'M' : session.name.charAt(0).toUpperCase()}
      </Link>
    </header>
  );
}

export function TitleBar({ title, back = '/' }) {
  return (
    <header className="titlebar">
      <Link href={back} className="back" aria-label="Back"><BackIcon /></Link>
      <h1>{title}</h1>
    </header>
  );
}

// Small "certificate attached" row that opens the full-screen viewer.
export function CertLink({ id, label = 'Medical certificate' }) {
  return (
    <Link href={`/certificate/${id}`} className="certlink">
      <span className="paper" aria-hidden="true"><i /><i /><i /><i className="s" /></span>
      <span><b>{label}</b><small>Tap to view</small></span>
      <em>View ›</em>
    </Link>
  );
}

export function RequestRow({ item, showReason = false, showName = false, showCancel = false }) {
  return (
    <div className={`row ${item.status === 'cancelled' ? 'gone' : ''}`}>
      <i className={`tm ${item.kind === 'leave' ? 'lv' : 'so'}`} aria-hidden="true" />
      <b>{showName ? `${item.name} · ${item.title}` : item.title}</b>
      <span className={`pill ${item.status}`}>{item.statusLabel}</span>
      <small>{item.when}</small>
      {showReason && <span className="reason">{item.medical && <span className="medtag">Medical</span>} {item.reason}</span>}
      {showReason && item.certificate && <CertLink id={item.id} />}
      {item.timed && <CheckIn item={item} />}
      {showCancel && item.canCancel && <CancelRequest item={item} />}
    </div>
  );
}

export { TabBar };
