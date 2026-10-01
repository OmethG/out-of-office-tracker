import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import TabBar from './TabBar';
import CheckIn from './CheckIn';
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

export function RequestRow({ item, showReason = false, showName = false }) {
  return (
    <div className="row">
      <i className={`tm ${item.kind === 'leave' ? 'lv' : 'so'}`} aria-hidden="true" />
      <b>{showName ? `${item.name} · ${item.title}` : item.title}</b>
      <span className={`pill ${item.status}`}>{item.statusLabel}</span>
      <small>{item.when}</small>
      {showReason && <span className="reason">{item.reason}</span>}
      {item.timed && <CheckIn item={item} />}
    </div>
  );
}

export { TabBar };
