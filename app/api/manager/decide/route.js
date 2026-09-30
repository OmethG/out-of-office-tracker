import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import { decide } from '../../../../lib/decide';

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'manager') {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id) || !['approve', 'decline'].includes(body.action)) {
    return NextResponse.json({ error: 'Something went wrong. Refresh and try again.' }, { status: 400 });
  }
  const { row, changed } = await decide({ id }, body.action);
  if (!row) return NextResponse.json({ error: 'That request no longer exists.' }, { status: 404 });
  if (!changed) {
    return NextResponse.json({ error: `This request was already ${row.status}.`, status: row.status }, { status: 409 });
  }
  return NextResponse.json({ ok: true, status: row.status });
}
