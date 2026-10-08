// Joining dates and birthdays: plain "YYYY-MM-DD" strings, so they never shift with timezones.
// Birthdays are stored with the year but only the day and month are ever shown.
import { localDate } from './time';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// A real calendar date: "2026-02-30" is not.
export function validYmd(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const split = (ymd) => ymd.split('-').map(Number);
const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

// "9 February 2020"
export function joinedLabel(ymd) {
  const [y, m, d] = split(ymd);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// "17 October" (no year, so nobody's age is on display)
export function birthdayLabel(ymd) {
  const [, m, d] = split(ymd);
  return `${d} ${MONTHS[m - 1]}`;
}

// "6 years, 8 months with MethG"
export function tenureLabel(joined, today = localDate()) {
  if (joined > today) return `Starts ${joinedLabel(joined)}`;
  const [y1, m1, d1] = split(joined);
  const [y2, m2, d2] = split(today);
  let months = (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
  const years = Math.floor(months / 12);
  months %= 12;
  const bits = [];
  if (years) bits.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months) bits.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  return bits.length ? `${bits.join(', ')} with MethG` : 'Joined this month';
}

// Days until the next birthday (0 = today). 29 February counts as 28 February in other years.
export function daysToBirthday(birthday, today = localDate()) {
  const [, bm, bd] = split(birthday);
  const [ty] = split(today);
  const on = (y) => {
    const d = bm === 2 && bd === 29 && !leap(y) ? 28 : bd;
    return Date.UTC(y, bm - 1, d);
  };
  const [y, m, d] = split(today);
  const now = Date.UTC(y, m - 1, d);
  let next = on(ty);
  if (next < now) next = on(ty + 1);
  return Math.round((next - now) / 86400000);
}

// "Birthday today", "Birthday tomorrow", "Birthday in 6 days"; null when it's more than a week away.
export function birthdaySoon(birthday, today = localDate()) {
  if (!birthday) return null;
  const n = daysToBirthday(birthday, today);
  if (n === 0) return 'Birthday today';
  if (n === 1) return 'Birthday tomorrow';
  return n <= 7 ? `Birthday in ${n} days` : null;
}

// The line under the birthday on a person's page.
export function birthdayWhen(birthday, today = localDate()) {
  const n = daysToBirthday(birthday, today);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n <= 31) return `In ${n} days`;
  const months = Math.round(n / 30.4);
  return `In about ${months} ${months === 1 ? 'month' : 'months'}`;
}
