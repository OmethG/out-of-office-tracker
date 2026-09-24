import { query } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export async function GET() {
  const { rows } = await query('SELECT * FROM leave_requests ORDER BY created_at DESC');

  const header = ['Employee', 'Leaving', 'Back by', 'Reason', 'Status', 'Requested at', 'Decided at'];
  const lines = [header.map(csvEscape).join(',')];

  for (const r of rows) {
    lines.push(
      [
        r.employee_name,
        new Date(r.leave_time).toLocaleString(),
        new Date(r.expected_return_time).toLocaleString(),
        r.reason,
        r.status,
        new Date(r.created_at).toLocaleString(),
        r.decided_at ? new Date(r.decided_at).toLocaleString() : '',
      ]
        .map(csvEscape)
        .join(',')
    );
  }

  const csv = lines.join('\r\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="out-of-office-requests-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
