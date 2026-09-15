import { query } from '../../lib/db';

export const dynamic = 'force-dynamic';

function statusColor(status) {
  if (status === 'approved') return '#1a7f37';
  if (status === 'declined') return '#c0392b';
  return '#b8860b';
}

export default async function RequestsPage() {
  const { rows } = await query('SELECT * FROM leave_requests ORDER BY created_at DESC LIMIT 200');

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', fontFamily: '-apple-system, system-ui, sans-serif', padding: '0 16px' }}>
      <h1 style={{ fontSize: 22 }}>Out-of-office requests</h1>
      <p style={{ color: '#666', fontSize: 13 }}>Most recent first.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '8px 6px' }}>Employee</th>
              <th style={{ padding: '8px 6px' }}>Leaving</th>
              <th style={{ padding: '8px 6px' }}>Back by</th>
              <th style={{ padding: '8px 6px' }}>Reason</th>
              <th style={{ padding: '8px 6px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '16px 6px', color: '#888' }}>No requests yet.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px 6px' }}>{r.employee_name}</td>
                <td style={{ padding: '8px 6px' }}>{new Date(r.leave_time).toLocaleString()}</td>
                <td style={{ padding: '8px 6px' }}>{new Date(r.expected_return_time).toLocaleString()}</td>
                <td style={{ padding: '8px 6px', maxWidth: 320 }}>{r.reason}</td>
                <td style={{ padding: '8px 6px', fontWeight: 600, color: statusColor(r.status) }}>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
