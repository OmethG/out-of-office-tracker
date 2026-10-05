import { query } from './db';
import { ENTITLEMENT, balanceLine, categoryOf, leaveYear } from './leaveRules';

export * from './leaveRules';

function emptyBalance() {
  const b = { shortCount: 0, total: { total: ENTITLEMENT.annual + ENTITLEMENT.casual, left: 0 } };
  for (const c of ['annual', 'casual']) b[c] = { total: ENTITLEMENT[c], used: 0, pending: 0, left: ENTITLEMENT[c] };
  b.medical = { used: 0, pending: 0 }; // no limit, so only a count
  return b;
}

// Leave balances for one or more people in a leave year. Only approved leave counts as used;
// pending leave is shown as "waiting". Declined leave never counts.
export async function balancesFor(names, year = leaveYear()) {
  const out = {};
  for (const n of names) out[n] = emptyBalance();
  if (names.length === 0) return out;
  const { rows } = await query(
    `SELECT employee_name, leave_type, leave_category, status, COALESCE(SUM(days), 0) AS days, COUNT(*) AS n
     FROM leave_requests
     WHERE kind = 'leave' AND status IN ('approved', 'pending')
       AND start_date BETWEEN $1 AND $2 AND employee_name = ANY($3)
     GROUP BY employee_name, leave_type, leave_category, status`,
    [year.start, year.end, names]
  );
  for (const r of rows) {
    const b = out[r.employee_name];
    if (!b) continue;
    const cat = categoryOf({ kind: 'leave', leave_type: r.leave_type, leave_category: r.leave_category });
    if (cat === 'short') {
      if (r.status === 'approved') b.shortCount += Number(r.n);
      continue;
    }
    if (r.status === 'approved') b[cat].used += Number(r.days);
    else b[cat].pending += Number(r.days);
  }
  for (const n of names) {
    const b = out[n];
    for (const c of ['annual', 'casual']) b[c].left = b[c].total - b[c].used;
    b.total.left = b.annual.left + b.casual.left;
  }
  return out;
}

export async function balanceFor(name, year) {
  return (await balancesFor([name], year))[name];
}

// Approved leave in a leave year, for the "Leave taken" list.
export async function leaveTaken(name, year = leaveYear()) {
  const { rows } = await query(
    `SELECT * FROM leave_requests
     WHERE kind = 'leave' AND status = 'approved' AND employee_name = $1 AND start_date BETWEEN $2 AND $3
     ORDER BY start_date ASC, leave_time ASC`,
    [name, year.start, year.end]
  );
  return rows;
}


// Balance lines for a list of leave requests (each checked against its own leave year).
export async function balanceLinesFor(rows) {
  const out = {};
  const byYear = {};
  for (const r of rows) {
    if (r.kind !== 'leave' || !r.start_date) continue;
    const y = leaveYear(r.start_date);
    (byYear[y.start] ||= { year: y, rows: [] }).rows.push(r);
  }
  for (const { year, rows: list } of Object.values(byYear)) {
    const names = [...new Set(list.map((r) => r.employee_name))];
    const bal = await balancesFor(names, year);
    for (const r of list) out[r.id] = balanceLine(r, bal[r.employee_name]);
  }
  return out;
}
