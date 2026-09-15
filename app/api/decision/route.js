import { query } from '../../../lib/db';
import { sendEmployeeDecisionEmail } from '../../../lib/email';

function page(title, message, color) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; background:#f5f5f7; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
  .card { background:#fff; padding:36px 40px; border-radius:14px; box-shadow:0 2px 16px rgba(0,0,0,.08); max-width:420px; text-align:center; }
  h1 { color:${color}; font-size:21px; margin-bottom:8px; }
  p { color:#555; font-size:14px; line-height:1.5; }
</style>
</head>
<body><div class="card"><h1>${title}</h1><p>${message}</p></div></body>
</html>`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const action = searchParams.get('action');

  if (!token || !['approve', 'decline'].includes(action)) {
    return new Response(page('Invalid link', 'This link is invalid or malformed.', '#c0392b'), {
      status: 400,
      headers: { 'content-type': 'text/html' },
    });
  }

  const { rows } = await query('SELECT * FROM leave_requests WHERE decision_token = $1', [token]);
  const reqRow = rows[0];

  if (!reqRow) {
    return new Response(page('Not found', 'This request could not be found.', '#c0392b'), {
      status: 404,
      headers: { 'content-type': 'text/html' },
    });
  }

  if (reqRow.status !== 'pending') {
    return new Response(
      page('Already decided', `This request was already marked as "${reqRow.status}".`, '#888'),
      { headers: { 'content-type': 'text/html' } }
    );
  }

  const newStatus = action === 'approve' ? 'approved' : 'declined';
  await query('UPDATE leave_requests SET status = $1, decided_at = now() WHERE id = $2', [newStatus, reqRow.id]);

  sendEmployeeDecisionEmail({
    employeeEmail: reqRow.employee_email,
    employeeName: reqRow.employee_name,
    status: newStatus,
    leaveTime: reqRow.leave_time,
    expectedReturnTime: reqRow.expected_return_time,
  }).catch((err) => console.error('Failed to notify employee', err));

  const color = newStatus === 'approved' ? '#1a7f37' : '#c0392b';
  return new Response(
    page(
      newStatus === 'approved' ? 'Approved' : 'Declined',
      `${reqRow.employee_name}'s request has been ${newStatus}.`,
      color
    ),
    { headers: { 'content-type': 'text/html' } }
  );
}
