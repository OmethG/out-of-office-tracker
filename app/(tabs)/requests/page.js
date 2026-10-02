import { requireSession } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { toClient } from '../../../lib/requests';
import { RequestRow } from '../../components/Chrome';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your requests · MethG Staff' };

export default async function MyRequests() {
  const session = await requireSession('staff');
  const { rows } = await query(
    'SELECT * FROM leave_requests WHERE employee_name = $1 ORDER BY created_at DESC LIMIT 100',
    [session.name]
  );
  const items = rows.map((r) => toClient(r, { relative: true }));

  return (
    <>
      <main className="page">
        <div className="hello"><h1>Your requests</h1></div>
        {items.length === 0 ? (
          <div className="empty">Nothing here yet. Your step-out and leave requests will show up here.</div>
        ) : (
          <div className="list">
            {items.map((it) => <RequestRow key={it.id} item={it} showReason showCancel />)}
          </div>
        )}
      </main>
    </>
  );
}
