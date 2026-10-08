import Link from 'next/link';
import { requireSession } from '../../../lib/auth';
import { NextIcon, PeopleIcon } from '../../components/Icons';
import ThemeToggle from '../../components/ThemeToggle';
import SignOut from './SignOut';
import LeaveRules from '../../components/LeaveRules';
import { LeaveBreakdown, LeaveTaken } from '../../components/LeaveSummary';
import { balanceFor, leaveTaken, leaveYear } from '../../../lib/leave';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Account · MethG Staff' };

export default async function AccountPage() {
  const session = await requireSession();
  const manager = session.role === 'manager';
  const year = leaveYear();
  const [balance, taken] = manager
    ? [null, null]
    : await Promise.all([balanceFor(session.name, year), leaveTaken(session.name, year)]);

  return (
    <>
      <main className="page">
        <div className="hello"><h1>Account</h1></div>

        <div className="card">
          <div className="me">
            <span className="avatar">{manager ? 'M' : session.name.charAt(0).toUpperCase()}</span>
            <span>
              <b>{manager ? 'Manager' : session.name}</b>
              <small>Signed in as {session.username}</small>
            </span>
          </div>
        </div>

        {!manager && (
          <>
            <Link href="/staff" className="navrow">
              <span className="ni"><PeopleIcon /></span>
              <b>Staff</b>
              <NextIcon />
            </Link>
            <LeaveBreakdown balance={balance} year={year} />
            <LeaveTaken rows={taken} />
          </>
        )}

        <div className="card">
          <h2>Appearance</h2>
          <ThemeToggle variant="switch" />
          <p>Dark mode is saved on this phone only.</p>
        </div>

        {manager ? (
          <div className="card">
            <h2>Add MethG Staff to your home screen</h2>
            <ol className="steps">
              <li><b>iPhone:</b> open this site in Safari, tap the Share button, then “Add to Home Screen”.</li>
              <li><b>Android:</b> open it in Chrome, tap the ⋮ menu, then “Add to Home screen” or “Install app”.</li>
            </ol>
          </div>
        ) : (
          <LeaveRules />
        )}

        <SignOut />
      </main>
    </>
  );
}
