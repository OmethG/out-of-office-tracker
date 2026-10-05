import { query } from './db';
import { ENTITLEMENT, balanceLine, categoryOf, leaveYear } from './leaveRules';

export * from './leaveRules';

function emptyBalance() {
  const b = { shortCount: 0, total: { total: ENTITLEMENT.annual + ENTITLEMENT.casual, left: 0 } };
  for (const c of ['annual', 'casual']) b[c] = { total: ENTITLEMENT[c], used: 0, pending: 0, left: ENTITLEMENT[c] };
  b.medicalCount = 0; // medical leaves this year (approved or waiting); part of casual
  return b;
}

// Leave balances for one or more people in a leave year. Only approved leave counts as used;
// pending leave is shown as "waiting". Declined leave never counts.
export async function balancesFor(names, year = leaveYear()) {
  const out = {};
  for (const n of names) out[n] = emptyBalance();
  if (names.length === 0) return out;
  const { rows } = await query(
    `SELECT employee_name, leave_type, leave_category, status, COALESCE(SUM(days), 0) AS days, COUNT(*) AS n,
            COUNT(*) FILTER (WHERE medical) AS med
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
    b.medicalCount += Number(r.med);
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

// How many medical leaves someone already has in the leave year of a date (approved or waiting).
export async function medicalCountFor(name, ymd) {
  const y = leaveYear(ymd);
  const { rows } = await query(
    `SELECT COUNT(*) AS n FROM leave_requests
     WHERE kind = 'leave' AND medical AND status IN ('approved', 'pending')
       AND employee_name = $1 AND start_date BETWEEN $2 AND $3`,
    [name, y.start, y.end]
  );
  return Number(rows[0].n);
}

// For medical requests: which medical leave of that person's leave year each one is (1, 2, 3, 4...).
export async function medicalNumbersFor(rows) {
  const ids = rows.filter((r) => r.medical).map((r) => r.id);
  if (ids.length === 0) return {};
  const { rows: found } = await query(
    `SELECT id, rn FROM (
       SELECT id, ROW_NUMBER() OVER (
         PARTITION BY employee_name,
           CASE WHEN EXTRACT(MONTH FROM start_date) >= 4 THEN EXTRACT(YEAR FROM start_date) ELSE EXTRACT(YEAR FROM start_date) - 1 END
         ORDER BY created_at, id) AS rn
       FROM leave_requests
       WHERE kind = 'leave' AND medical AND status IN ('approved', 'pending')
     ) m WHERE id = ANY($1)`,
    [ids]
  );
  return Object.fromEntries(found.map((f) => [f.id, Number(f.rn)]));
}
