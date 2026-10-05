// Leave rules with no database access, so both server and phone code can use them.
import { localDate } from './time';

// Leave allowance per leave year (MethG's financial year, 1 April – 31 March). Unused days don't carry over.
export const ENTITLEMENT = { annual: 14, casual: 7 };
export const CATEGORY_LABEL = { annual: 'Annual', casual: 'Casual', medical: 'Medical', short: 'Short leave' };

export function leaveYear(ymd = localDate()) {
  const [y, m] = ymd.split('-').map(Number);
  const s = m >= 4 ? y : y - 1;
  return {
    start: `${s}-04-01`,
    end: `${s + 1}-03-31`,
    label: `Apr ${s} – Mar ${s + 1}`,
    long: `1 Apr ${s} – 31 Mar ${s + 1}`,
  };
}

// Medical leave has no limit and doesn't use the 21 days, but always needs a certificate or other proof.
// 'annual' | 'casual' | 'medical' | 'short' for leave, null for step outs.
// Leave sent before annual/casual existed counts as annual.
export function categoryOf(row) {
  if ((row.kind || 'step_out') !== 'leave') return null;
  if (row.leave_type === 'short') return 'short';
  if (row.leave_category === 'medical') return 'medical';
  return row.leave_category === 'casual' ? 'casual' : 'annual';
}

// 2 → "2", 0.5 → "0.5", 1.50 → "1.5"
export function fmtDays(n) {
  return String(Math.round(Number(n) * 10) / 10);
}

// "1 day", "0.5 day", "2 days"
export function dayWord(n) {
  return `${fmtDays(n)} ${Number(n) <= 1 ? 'day' : 'days'}`;
}

// The line the manager sees on a leave request: what's left and what will be left.
// tone: 'fine' (enough left), 'over' (red: not enough left), 'none' (short leave).
export function balanceLine(row, balance) {
  const cat = categoryOf(row);
  if (!cat) return null;
  if (cat === 'short') return { tone: 'none', text: "Short leave · doesn't use leave days" };
  if (cat === 'medical') {
    const taken = balance.medical.used;
    return { tone: 'none', text: `Doesn't use leave days · ${fmtDays(taken)} medical ${taken === 1 ? 'day' : 'days'} so far this year` };
  }
  const label = CATEGORY_LABEL[cat];
  const left = balance[cat].left;
  const need = Number(row.days) || 0;
  const after = left - need;
  if (after < 0) {
    const over = dayWord(need - Math.max(left, 0));
    return {
      tone: 'over',
      text: left <= 0 ? `${label}: none left · ${over} over` : `${label}: only ${fmtDays(left)} left · ${over} over`,
    };
  }
  return { tone: 'fine', text: `${label}: ${fmtDays(left)} left → ${fmtDays(after)} after` };
}
