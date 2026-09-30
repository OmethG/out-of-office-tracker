// All dates and times are shown in Sri Lanka time, whatever timezone the server runs in.
export const TZ = 'Asia/Colombo';
export const TZ_OFFSET = '+05:30';

// Half-day hours, agreed with the manager.
export const HALF_DAY = {
  morning: { label: 'Morning', start: '09:00', end: '13:00', text: '9:00 AM – 1:00 PM' },
  afternoon: { label: 'Afternoon', start: '13:00', end: '17:00', text: '1:00 – 5:00 PM' },
};
export const DAY_START = '09:00';
export const DAY_END = '17:00';

function parts(date, opts) {
  const out = {};
  for (const p of new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...opts }).formatToParts(date)) {
    out[p.type] = p.value;
  }
  return out;
}

// "2026-09-30" for a moment in time, in Sri Lanka.
export function localDate(date = new Date()) {
  const p = parts(new Date(date), { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${p.year}-${p.month}-${p.day}`;
}

// "Wed 30 Sep" for a moment in time.
export function dayLabel(date) {
  const p = parts(new Date(date), { weekday: 'short', day: 'numeric', month: 'short' });
  return `${p.weekday} ${p.day} ${p.month}`;
}

// "Wed 30 Sep" for a calendar date string "2026-09-30".
export function dateLabel(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const p = {};
  for (const x of new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(dt)) {
    p[x.type] = x.value;
  }
  return { weekday: p.weekday, day: p.day, month: p.month, text: `${p.weekday} ${p.day} ${p.month}` };
}

// "2:30 PM"
export function timeLabel(date) {
  const p = parts(new Date(date), { hour: 'numeric', minute: '2-digit' });
  return `${p.hour}:${p.minute} ${p.dayPeriod}`;
}

// "Wed 30 Sep, 2:30 PM"
export function dateTimeLabel(date) {
  return `${dayLabel(date)}, ${timeLabel(date)}`;
}

// "2:30 – 4:00 PM" or "11:00 AM – 1:00 PM"
export function timeRange(a, b) {
  const ta = timeLabel(a);
  const tb = timeLabel(b);
  const [ha, pa] = ta.split(' ');
  const [, pb] = tb.split(' ');
  return pa === pb ? `${ha} – ${tb}` : `${ta} – ${tb}`;
}

// "September 2026" for "2026-09"
export function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(Date.UTC(y, m - 1, 15)));
}

export function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Moment a calendar date + clock time happens in Sri Lanka.
export function atLocal(ymd, hhmm) {
  return new Date(`${ymd}T${hhmm}:00${TZ_OFFSET}`);
}

export function isYmd(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(`${s}T00:00:00Z`));
}

export function addDays(ymd, n) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekday(ymd) {
  return new Date(`${ymd}T12:00:00Z`).getUTCDay();
}
export const isSunday = (ymd) => weekday(ymd) === 0;
export const isSaturday = (ymd) => weekday(ymd) === 6;

// The working week: Monday to Friday 9 AM – 5 PM, Saturday 9 AM – 1 PM, Sunday off.
export const SATURDAY_END = '13:00';

// Working days between two dates, both included. Saturday counts as half a day.
export function workingDays(start, end) {
  let n = 0;
  let i = 0;
  for (let d = start; d <= end && i < 400; d = addDays(d, 1), i++) {
    if (isSaturday(d)) n += 0.5;
    else if (!isSunday(d)) n += 1;
  }
  return n;
}

export function nextWorkingDay(ymd) {
  let d = addDays(ymd, 1);
  while (isSunday(d)) d = addDays(d, 1);
  return d;
}

// "1 day", "half a day", "2.5 days"
export function daysLabel(n) {
  if (n === 0.5) return 'half a day';
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}

// "1 hr 30 min"
export function durationLabel(ms) {
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr`;
  return `${m} min`;
}
