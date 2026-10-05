import { notFound } from 'next/navigation';
import { requireSession } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { describe } from '../../../lib/requests';
import { dateTimeLabel } from '../../../lib/time';
import BackButton from './BackButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Certificate · MethG Staff' };

// Full-screen view of a medical certificate, for the manager and the person who sent it.
export default async function Certificate({ params }) {
  const session = await requireSession();
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();
  const { rows } = await query(
    `SELECT r.*, a.mime FROM leave_requests r JOIN leave_attachments a ON a.request_id = r.id WHERE r.id = $1`,
    [id]
  );
  const row = rows[0];
  if (!row || (session.role !== 'manager' && session.name !== row.employee_name)) notFound();
  const d = describe(row);
  const src = `/api/certificate/${row.id}`;

  return (
    <div className="certview">
      <header>
        <BackButton fallback={session.role === 'manager' ? '/manager' : '/requests'} />
        <div>
          <b>{row.employee_name} · Medical certificate</b>
          <small>{d.when}</small>
        </div>
      </header>
      <main>
        {row.mime === 'application/pdf' ? (
          <>
            <iframe src={src} title="Medical certificate" />
            <a className="btn ghost" href={src} target="_blank" rel="noreferrer">Open the PDF</a>
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`Medical certificate from ${row.employee_name}`} />
        )}
      </main>
      <footer>Sent {dateTimeLabel(row.created_at)}</footer>
    </div>
  );
}
