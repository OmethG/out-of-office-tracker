import { getSession } from '../../../../lib/auth';
import { query } from '../../../../lib/db';

// The certificate attached to a medical leave request. Only the manager and the person who sent it can open it.
export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return new Response('Please sign in again.', { status: 401 });
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) return new Response('Not found', { status: 404 });

  const { rows } = await query(
    `SELECT a.name, a.mime, a.data, r.employee_name
     FROM leave_attachments a JOIN leave_requests r ON r.id = a.request_id
     WHERE a.request_id = $1`,
    [id]
  );
  const file = rows[0];
  if (!file) return new Response('Not found', { status: 404 });
  if (session.role !== 'manager' && session.name !== file.employee_name) {
    return new Response("You don't have access to that.", { status: 403 });
  }
  return new Response(file.data, {
    headers: {
      'Content-Type': file.mime,
      'Content-Disposition': `inline; filename="${file.name.replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
