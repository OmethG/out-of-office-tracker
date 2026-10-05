import { query } from './db';
import { categoryOf, CATEGORY_LABEL } from './leaveRules';
import { isTimed } from './checkin';
import { HALF_DAY, addDays, atLocal, dayLabel, isSunday, localDate, timeLabel, timeRange } from './time';

// Who is out of the office, day by day. Only approved requests count.
// Staff see the name, the kind of absence and the times. The manager also sees the reason and leave type.
function entryFor(row, day, { manager, now }) {
  const today = localDate(now);
  const cat = categoryOf(row);
  const base = { id: row.id, name: row.employee_name, tone: row.kind === 'leave' ? 'lv' : 'so', chipTone: '', back: false };

  if (isTimed(row)) {
    if (localDate(row.leave_time) !== day) return null;
    const start = new Date(row.leave_time);
    const due = new Date(row.expected_return_time);
    const label = cat === 'short' ? 'Short leave' : 'Step out';
    let chip = timeRange(start, due);
    let chipTone = '';
    let back = false;
    if (row.no_return) {
      // Gone home for the day: no "back by", no overdue.
      const left = day === today && now >= start;
      const gone = left ? 'Left for the day' : 'Leaving early';
      return { ...base, label: gone, detail: manager ? `${gone} · ${row.reason}` : gone, chip: timeLabel(start), chipTone: '', back: false, sort: start.getTime() };
    }
    if (day === today) {
      if (row.returned_at) {
        chip = `✓ Back ${timeLabel(row.returned_at)}`;
        chipTone = 'ok';
        back = true;
      } else if (now >= start) {
        const overdue = now > due && row.checkin_on !== false;
        chip = overdue && manager ? `Due ${timeLabel(due)}` : `Back by ${timeLabel(due)}`;
        chipTone = overdue && manager ? 'bad' : '';
      }
    }
    return { ...base, label, detail: manager ? `${label} · ${row.reason}` : label, chip, chipTone, back, sort: start.getTime() };
  }

  // Full or half day leave
  if (!row.start_date || day < row.start_date || day > row.end_date || isSunday(day)) return null;
  const catLabel = CATEGORY_LABEL[cat];
  if (row.leave_type === 'half') {
    const h = HALF_DAY[row.half] || HALF_DAY.morning;
    const morning = (row.half || 'morning') === 'morning';
    return {
      ...base,
      label: 'Half day',
      detail: manager ? `${catLabel} half day · ${row.reason}` : 'Half day',
      chip: morning ? `Until ${timeLabel(atLocal(day, h.end))}` : `From ${timeLabel(atLocal(day, h.start))}`,
      sort: atLocal(day, h.start).getTime(),
    };
  }
  return {
    ...base,
    label: 'On leave',
    detail: manager ? `${catLabel} leave · ${row.reason}` : 'On leave',
    chip: 'All day',
    sort: atLocal(day, '00:00').getTime(),
  };
}

// [{ day: '2026-10-05', label: 'Mon 5 Oct', today: true, people: [...] }, ...] for `days` working days from today.
export async function whoIsOut({ days = 1, manager = false } = {}) {
  const now = new Date();
  const today = localDate(now);
  const list = [];
  for (let d = today; list.length < days; d = addDays(d, 1)) {
    if (!isSunday(d) || d === today) list.push(d);
  }
  const first = list[0];
  const last = list[list.length - 1];
  const { rows } = await query(
    `SELECT * FROM leave_requests
     WHERE status = 'approved' AND leave_time < $2 AND expected_return_time >= $1
     ORDER BY leave_time ASC`,
    [atLocal(first, '00:00').toISOString(), atLocal(addDays(last, 1), '00:00').toISOString()]
  );
  return list.map((day) => {
    const people = rows
      .map((r) => entryFor(r, day, { manager, now }))
      .filter(Boolean)
      .sort((a, b) => Number(a.back) - Number(b.back) || a.sort - b.sort || a.name.localeCompare(b.name));
    return { day, label: dayLabel(atLocal(day, '12:00')), today: day === today, people };
  });
}
