import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/auth';
import { query } from '../../../../../lib/db';

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'manager') {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  await query('DELETE FROM leave_requests WHERE id = $1', [Number(id)]);
  return NextResponse.json({ ok: true });
}
