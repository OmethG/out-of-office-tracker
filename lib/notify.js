import { notifyManager, notifyStaff } from './push';
import { describe } from './requests';

// The words on the lock screen. No reasons or medical details, only the type and the date.
const kindWord = (row) => (row.kind === 'leave' ? 'leave' : 'step out');
const typeLine = (row) => {
  const d = describe(row, { relative: true });
  if (row.kind !== 'leave') return d.when;
  if (d.title === 'Short leave') return `Short leave · ${d.when}`;
  return `${d.leaveLabel} leave · ${d.when}`;
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function pushNewRequest(row) {
  return notifyManager({
    title: `New ${kindWord(row)} request`,
    body: `${row.employee_name} · ${typeLine(row)}. Tap to approve or decline.`,
    url: '/manager',
    tag: `req-${row.id}`,
  });
}

export function pushDecision(row) {
  const word = row.status === 'approved' ? 'approved' : 'declined';
  return notifyStaff(row.employee_name, {
    title: `${cap(kindWord(row))} request ${word}`,
    body: `${typeLine(row)} was ${word}.`,
    url: '/requests',
    tag: `req-${row.id}`,
  });
}

export function pushCancelled(row) {
  return notifyManager({
    title: `${cap(kindWord(row))} cancelled`,
    body: `${row.employee_name} cancelled ${typeLine(row)}.`,
    url: '/manager/history',
    tag: `req-${row.id}`,
  });
}
