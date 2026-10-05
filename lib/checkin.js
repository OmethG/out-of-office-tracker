import { durationLabel, localDate, timeLabel } from './time';

// Within 15 minutes either side of "Back by" counts as on time.
export const ON_TIME_MS = 15 * 60 * 1000;

// Step outs and short leave have a leaving and back-by time, so they get "I'm back".
export function isTimed(row) {
  const kind = row.kind || 'step_out';
  return kind === 'step_out' || (kind === 'leave' && row.leave_type === 'short');
}

// "on time", "1 hr late", "40 min early"
export function returnLabel(returnedAt, expected) {
  const diff = new Date(returnedAt) - new Date(expected);
  if (Math.abs(diff) <= ON_TIME_MS) return 'on time';
  return diff > 0 ? `${durationLabel(diff)} late` : `${durationLabel(-diff)} early`;
}

// Staff can tap "I'm back" from the time they leave until midnight that day.
export function canCheckIn(row, now = new Date()) {
  if (!isTimed(row)) return false;
  if (row.no_return) return false; // left for the day: nobody is expected back
  if (row.status === 'declined' || row.status === 'cancelled' || row.returned_at) return false;
  const start = new Date(row.leave_time);
  if (now < start) return false;
  return localDate(now) <= localDate(row.expected_return_time);
}

// The check-in line under a step out:
//   green  "✓ Back at 3:00 PM · 1 hr late"   (always green once they've tapped "I'm back")
//   red    "Not back yet · was due 12:30 PM" (on the day, once "Back by" has passed)
//   red    "No check-in"                     (the day is over and they never tapped it)
export function checkInStatus(row, now = new Date()) {
  if (!isTimed(row) || row.no_return || row.status === 'declined' || row.status === 'cancelled') return null;
  if (row.returned_at) {
    return {
      tone: 'ok',
      label: `✓ Back at ${timeLabel(row.returned_at)} · ${returnLabel(row.returned_at, row.expected_return_time)}`,
      short: returnLabel(row.returned_at, row.expected_return_time),
    };
  }
  // Requests sent before check-in existed have nothing to show.
  if (row.checkin_on === false) return null;
  const due = new Date(row.expected_return_time);
  if (now <= due) return null;
  if (localDate(now) <= localDate(due)) {
    return { tone: 'out', label: `Not back yet · was due ${timeLabel(due)}`, short: 'Not back yet' };
  }
  if (row.status !== 'approved') return null;
  return { tone: 'out', label: 'No check-in', short: 'No check-in' };
}
