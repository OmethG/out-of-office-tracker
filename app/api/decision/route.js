import { decide } from '../../../lib/decide';
import { describe } from '../../../lib/requests';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function page(title, message, color, status = 200) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} · MethG Staff</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; background:#f5f6fa; color:#10143a; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:20px; box-sizing:border-box; }
  .card { background:#fff; padding:32px 28px; border-radius:16px; box-shadow:0 10px 30px -18px rgba(16,20,58,.35); max-width:400px; width:100%; text-align:center; border-top:4px solid ${color}; }
  img { width:64px; margin-bottom:14px; }
  h1 { color:${color}; font-size:22px; margin:0 0 8px; }
  p { color:#555a78; font-size:15px; line-height:1.5; margin:0 0 6px; }
  a { color:#023abe; font-weight:600; }
</style>
</head>
<body><div class="card"><img src="/brand/logo.png" alt="MethG"><h1>${esc(title)}</h1>${message}<p style="margin-top:16px;"><a href="/manager">Open MethG Staff</a></p></div></body>
</html>`;
  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

// The Approve / Decline buttons in the manager's email land here. No sign-in needed: the token is the key.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const action = searchParams.get('action');

  if (!token || !['approve', 'decline'].includes(action)) {
    return page('Invalid link', '<p>This link is incomplete. Open the request from the email again.</p>', '#b42318', 400);
  }

  const { row, changed } = await decide({ token }, action);
  if (!row) {
    return page('Not found', '<p>This request could not be found. It may have been deleted.</p>', '#b42318', 404);
  }
  const d = describe(row);
  const summary = `<p><b>${esc(row.employee_name)}</b> · ${esc(d.title)}</p><p>${esc(d.when)}</p>`;

  if (!changed) {
    return page(`Already ${row.status}`, `${summary}<p>Nothing was changed.</p>`, '#6a6f8e');
  }
  const approved = row.status === 'approved';
  const note = row.employee_email ? `<p>${esc(row.employee_name)} has been emailed.</p>` : '';
  return page(approved ? 'Approved' : 'Declined', `${summary}${note}`, approved ? '#157347' : '#b42318');
}
