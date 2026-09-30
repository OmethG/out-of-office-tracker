import {
  HALF_DAY,
  dateLabel,
  daysLabel,
  dayLabel,
  dateTimeLabel,
  localDate,
  timeLabel,
  timeRange,
} from './time';

// Turns a database row into the words shown in the app, emails and the Excel export.
export function describe(row, { relative = false } = {}) {
  if (row.kind === 'leave') {
    if (row.leave_type === 'half') {
      const h = HALF_DAY[row.half] || HALF_DAY.morning;
      return {
        title: 'Leave · Half day',
        typeLabel: 'Leave',
        detailLabel: `Half day (${h.label.toLowerCase()})`,
        when: `${dateLabel(row.start_date).text} · ${h.text}`,
        days: 0.5,
      };
    }
    const s = dateLabel(row.start_date);
    const e = dateLabel(row.end_date);
    const n = Number(row.days) || 1;
    const dayWord = daysLabel(n);
    let range;
    if (row.start_date === row.end_date) range = s.text;
    else if (s.month === e.month) range = `${s.weekday} ${s.day} – ${e.text}`;
    else range = `${s.text} – ${e.text}`;
    return {
      title: 'Leave · Full day',
      typeLabel: 'Leave',
      detailLabel: 'Full day',
      when: `${range} · ${dayWord}`,
      days: n,
    };
  }

  // Step out
  const start = new Date(row.leave_time);
  const end = new Date(row.expected_return_time);
  let when;
  if (localDate(start) === localDate(end)) {
    const today = localDate() === localDate(start);
    when = `${relative && today ? 'Today' : dayLabel(start)} · ${timeRange(start, end)}`;
  } else {
    when = `${dateTimeLabel(start)} – ${dateTimeLabel(end)}`;
  }
  return { title: 'Step out', typeLabel: 'Step out', detailLabel: '', when, days: null };
}

export function statusLabel(status) {
  if (status === 'approved') return 'Approved';
  if (status === 'declined') return 'Declined';
  return 'Pending';
}

// Rows as plain objects the client components can receive.
export function toClient(row, opts) {
  const d = describe(row, opts);
  return {
    id: row.id,
    kind: row.kind || 'step_out',
    name: row.employee_name,
    reason: row.reason,
    status: row.status,
    statusLabel: statusLabel(row.status),
    title: d.title,
    when: d.when,
    requestedAt: dateTimeLabel(row.created_at),
    decidedAt: row.decided_at ? dateTimeLabel(row.decided_at) : null,
  };
}

export { timeLabel };
