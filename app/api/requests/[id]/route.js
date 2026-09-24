import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function DELETE(req, { params }) {
  const { id } = await params;

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }

  await query('DELETE FROM leave_requests WHERE id = $1', [id]);
  return NextResponse.json({ ok: true });
}
