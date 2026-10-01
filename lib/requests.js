import {
  HALF_DAY,
  dateLabel,
  daysLabel,
  dayLabel,
  dateTimeLabel,
  durationLabel,
  localDate,
  timeLabel,
  timeRange,
} from './time';
import { canCheckIn, checkInStatus, isTimed } from './checkin';
import { CATEGORY_LABEL, categoryOf } from './leaveRules';

// Turns a database row into the words shown in the app, emails and the Excel export.
export function describe(row, { relative = false } = {}) {
  const cat = categoryOf(row);
  if (cat === 'short') {
    const t = timeWindow(row, relative);
    return {
      title: 'Short leave',
      typeLabel: 'Leave',
      leaveLabel: CATEGORY_LABEL.short,
      detailLabel: durationLabel(new Date(row.expected_return_time) - new Date(row.leave_time)),
      when: t,
      days: null,
    };
  }
  if (row.kind === 'leave') {
    const name = `${CATEGORY_LABEL[cat]} leave`;
    if (row.leave_type === 'half') {
      const h = HALF_DAY[row.half] || HALF_DAY.morning;
      return {
        title: `${name} · Half day`,
        typeLabel: 'Leave',
        leaveLabel: CATEGORY_LABEL[cat],
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
      title: `${name} · Full day`,
      typeLabel: 'Leave',
      leaveLabel: CATEGORY_LABEL[cat],
      detailLabel: 'Full day',
      when: `${range} · ${dayWord}`,
      days: n,
    };
  }

  // Step out
  return { title: 'Step out', typeLabel: 'Step out', leaveLabel: '', detailLabel: '', when: timeWindow(row, relative), days: null };
}

// "Today · 10:30 AM – 2:00 PM" for step outs and short leave.
function timeWindow(row, relative) {
  const start = new Date(row.leave_time);
  const end = new Date(row.expected_return_time);
  if (localDate(start) === localDate(end)) {
    const today = localDate() === localDate(start);
    return `${relative && today ? 'Today' : dayLabel(start)} · ${timeRange(start, end)}`;
  }
  return `${dateTimeLabel(start)} – ${dateTimeLabel(end)}`;
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
    back: checkInStatus(row),
    canCheckIn: canCheckIn(row),
    timed: isTimed(row),
    category: categoryOf(row),
    days: row.days == null ? null : Number(row.days),
  };
}

export { timeLabel };
