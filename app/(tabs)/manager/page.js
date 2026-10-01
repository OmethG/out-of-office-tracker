import Link from 'next/link';
import { requireSession } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { toClient } from '../../../lib/requests';
import ApprovalCard from './ApprovalCard';
import { balanceLinesFor } from '../../../lib/leave';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Approvals · MethG Staff' };

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'step_out', label: 'Step out' },
  { key: 'leave', label: 'Leave' },
];

export default async function Approvals({ searchParams }) {
  const session = await requireSession('manager');
  const sp = await searchParams;
  const type = FILTERS.some((f) => f.key === sp?.type) ? sp.type : 'all';

  const { rows } = await query("SELECT * FROM leave_requests WHERE status = 'pending' ORDER BY leave_time ASC");
  const lines = await balanceLinesFor(rows);
  const all = rows.map((r) => ({ ...toClient(r, { relative: true }), balance: lines[r.id] || null }));
  const items = type === 'all' ? all : all.filter((i) => i.kind === type);

  return (
    <>
      <main className="page">
        <div className="hello" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1>Approvals</h1>
          {all.length > 0 && <span className="badge">{all.length} waiting</span>}
        </div>
        <div className="chips">
          {FILTERS.map((f) => (
            <Link key={f.key} href={f.key === 'all' ? '/manager' : `/manager?type=${f.key}`} className={type === f.key ? 'on' : ''}>
              {f.label}
            </Link>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="empty">Nothing waiting for you. New requests show up here, soonest first.</div>
        ) : (
          items.map((it) => <ApprovalCard key={it.id} item={it} />)
        )}
      </main>
    </>
  );
}
