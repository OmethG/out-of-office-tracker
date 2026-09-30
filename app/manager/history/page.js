import Link from 'next/link';
import { requireSession } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { toClient } from '../../../lib/requests';
import { atLocal, localDate, monthLabel, shiftMonth } from '../../../lib/time';
import { TopBar, TabBar } from '../../components/Chrome';
import { BackIcon, NextIcon } from '../../components/Icons';
import HistoryItem from './HistoryItem';
import ExportButton from './ExportButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'History · MethG Staff' };

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'step_out', label: 'Step out' },
  { key: 'leave', label: 'Leave' },
];

export default async function History({ searchParams }) {
  const session = await requireSession('manager');
  const sp = await searchParams;
  const thisMonth = localDate().slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(sp?.m || '') ? sp.m : thisMonth;
  const type = FILTERS.some((f) => f.key === sp?.type) ? sp.type : 'all';

  const { rows } = await query(
    `SELECT * FROM leave_requests WHERE leave_time >= $1 AND leave_time < $2 ORDER BY leave_time DESC`,
    [atLocal(`${month}-01`, '00:00').toISOString(), atLocal(`${shiftMonth(month, 1)}-01`, '00:00').toISOString()]
  );
  const all = rows.map((r) => toClient(r));
  const items = type === 'all' ? all : all.filter((i) => i.kind === type);
  const link = (m, t) => {
    const q = new URLSearchParams();
    if (m !== thisMonth) q.set('m', m);
    if (t !== 'all') q.set('type', t);
    const s = q.toString();
    return `/manager/history${s ? `?${s}` : ''}`;
  };

  return (
    <>
      <TopBar session={session} />
      <main className="page">
        <div className="hello" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ flex: 1 }}>History</h1>
          <ExportButton month={month} today={localDate()} />
        </div>
        <div className="month">
          <Link href={link(shiftMonth(month, -1), type)} aria-label="Previous month"><BackIcon /></Link>
          <span>{monthLabel(month)} <small>· {all.length} {all.length === 1 ? 'request' : 'requests'}</small></span>
          {month < thisMonth ? (
            <Link href={link(shiftMonth(month, 1), type)} aria-label="Next month"><NextIcon /></Link>
          ) : (
            <span style={{ width: 36 }} />
          )}
        </div>
        <div className="chips">
          {FILTERS.map((f) => (
            <Link key={f.key} href={link(month, f.key)} className={type === f.key ? 'on' : ''}>{f.label}</Link>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="empty">No requests in {monthLabel(month)}.</div>
        ) : (
          <div className="list">
            {items.map((it) => <HistoryItem key={it.id} item={it} />)}
          </div>
        )}
      </main>
      <TabBar role="manager" />
    </>
  );
}
