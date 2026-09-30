import Link from 'next/link';
import { requireSession } from '../lib/auth';
import { query } from '../lib/db';
import { toClient } from '../lib/requests';
import { dayLabel } from '../lib/time';
import { TopBar, TabBar, RequestRow } from './components/Chrome';
import { CalendarIcon, DoorIcon } from './components/Icons';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await requireSession('staff');
  const { rows } = await query(
    'SELECT * FROM leave_requests WHERE employee_name = $1 ORDER BY created_at DESC LIMIT 4',
    [session.name]
  );
  const items = rows.map((r) => toClient(r, { relative: true }));

  return (
    <>
      <TopBar session={session} />
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
            <span><b>Request leave</b><small>Full day or half day</small></span>
          </Link>
        </div>

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
      <TabBar role="staff" />
    </>
  );
}
