import Link from 'next/link';
import { requireSession } from '../../lib/auth';
import { query } from '../../lib/db';
import { toClient } from '../../lib/requests';
import { dayLabel } from '../../lib/time';
import { RequestRow } from '../components/Chrome';
import { LeavesLeftCard } from '../components/LeaveSummary';
import { balanceFor, leaveYear } from '../../lib/leave';
import { CalendarIcon, DoorIcon } from '../components/Icons';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await requireSession('staff');
  const year = leaveYear();
  const [{ rows }, balance] = await Promise.all([
    query('SELECT * FROM leave_requests WHERE employee_name = $1 ORDER BY created_at DESC LIMIT 4', [session.name]),
    balanceFor(session.name, year),
  ]);
  const items = rows.map((r) => toClient(r, { relative: true }));

  return (
    <>
      <main className="page">
        <div className="hello">
          <small>{dayLabel(new Date())}</small>
          <h1>Hi, {session.name}</h1>
        </div>

        <div className="tiles">
          <Link href="/step-out" className="tile so">
            <span className="ic"><DoorIcon /></span>
            <span><b>Step out</b><small>Out for over an hour</small></span>
          </Link>
          <Link href="/leave" className="tile lv">
            <span className="ic"><CalendarIcon /></span>
            <span><b>Request leave</b><small>Full, half or short</small></span>
          </Link>
        </div>

        <LeavesLeftCard balance={balance} year={year} />

        <div className="sechead">
          Your requests
          {items.length > 0 && <Link href="/requests">See all</Link>}
        </div>
        {items.length === 0 ? (
          <div className="empty">No requests yet. When you send one, you&apos;ll see here whether it&apos;s been approved.</div>
        ) : (
          <div className="list">
            {items.map((it) => <RequestRow key={it.id} item={it} />)}
          </div>
        )}
      </main>
    </>
  );
}
