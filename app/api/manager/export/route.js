import ExcelJS from 'exceljs';
import { getSession } from '../../../../lib/auth';
import { query } from '../../../../lib/db';
import { describe, statusLabel } from '../../../../lib/requests';
import { TZ, addDays, atLocal, isYmd } from '../../../../lib/time';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BLUE = 'FF023ABE';
const PURPLE = 'FF470073';
const STATUS_COLOR = { approved: 'FF157347', declined: 'FFB42318', pending: 'FF9A5B00' };

// Excel has no timezones: give it the Sri Lanka wall-clock time so cells show what staff saw.
function localCell(date) {
  if (!date) return null;
  const p = {};
  for (const x of new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(date))) p[x.type] = Number(x.value);
  return new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute));
}

function fileName(from, to) {
  const wholeMonth = from.endsWith('-01') && from.slice(0, 7) === to.slice(0, 7) && addDays(to, 1).endsWith('-01');
  return wholeMonth ? `methg-requests-${from.slice(0, 7)}.xlsx` : `methg-requests-${from}-to-${to}.xlsx`;
}

// Manager: Excel file of requests between two dates (by when the time off starts).
export async function GET(req) {
  const session = await getSession();
  if (!session || session.role !== 'manager') return new Response('Please sign in again.', { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const kinds = (searchParams.get('types') || 'step_out,leave').split(',').filter((k) => ['step_out', 'leave'].includes(k));
  if (!isYmd(from) || !isYmd(to) || to < from || kinds.length === 0) {
    return new Response('Choose a date range and at least one request type.', { status: 400 });
  }

  const { rows } = await query(
    `SELECT * FROM leave_requests
     WHERE leave_time >= $1 AND leave_time < $2 AND kind = ANY($3)
     ORDER BY leave_time ASC`,
    [atLocal(from, '00:00').toISOString(), atLocal(addDays(to, 1), '00:00').toISOString(), kinds]
  );

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MethG Staff';
  wb.created = new Date();
  const ws = wb.addWorksheet('Requests', { views: [{ state: 'frozen', ySplit: 1 }] });
  const dt = 'ddd d mmm yyyy, h:mm AM/PM';
  ws.columns = [
    { header: 'Employee', key: 'name', width: 16 },
    { header: 'Type', key: 'type', width: 11 },
    { header: 'Details', key: 'details', width: 20 },
    { header: 'When', key: 'when', width: 34 },
    { header: 'From', key: 'from', width: 26, style: { numFmt: dt } },
    { header: 'To', key: 'to', width: 26, style: { numFmt: dt } },
    { header: 'Days', key: 'days', width: 7, style: { alignment: { horizontal: 'center' } } },
    { header: 'Reason', key: 'reason', width: 50, style: { alignment: { wrapText: true, vertical: 'top' } } },
    { header: 'Status', key: 'status', width: 11 },
    { header: 'Requested at', key: 'requested', width: 26, style: { numFmt: dt } },
    { header: 'Decided at', key: 'decided', width: 26, style: { numFmt: dt } },
  ];

  for (const r of rows) {
    const d = describe(r);
    const row = ws.addRow({
      name: r.employee_name,
      type: d.typeLabel,
      details: d.detailLabel,
      when: d.when,
      from: localCell(r.leave_time),
      to: localCell(r.expected_return_time),
      days: r.kind === 'leave' ? Number(r.days) : null,
      reason: r.reason,
      status: statusLabel(r.status),
      requested: localCell(r.created_at),
      decided: localCell(r.decided_at),
    });
    row.alignment = { vertical: 'top' };
    row.getCell('reason').alignment = { wrapText: true, vertical: 'top' };
    row.getCell('days').alignment = { horizontal: 'center', vertical: 'top' };
    row.getCell('type').font = { name: 'Calibri', size: 11, color: { argb: r.kind === 'leave' ? PURPLE : BLUE }, bold: true };
    row.getCell('status').font = { name: 'Calibri', size: 11, color: { argb: STATUS_COLOR[r.status] || STATUS_COLOR.pending }, bold: true };
  }

  const header = ws.getRow(1);
  header.height = 22;
  header.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
    cell.alignment = { vertical: 'middle', horizontal: cell.col === 7 ? 'center' : 'left' };
  });
  ws.autoFilter = { from: 'A1', to: 'K1' };
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:1' };

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName(from, to)}"`,
    },
  });
}
