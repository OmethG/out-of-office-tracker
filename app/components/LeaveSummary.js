import Link from 'next/link';
import { describe } from '../../lib/requests';
import { CATEGORY_LABEL, categoryOf, fmtDays } from '../../lib/leaveRules';

// Small card on staff Home: annual, casual and total days left this leave year.
export function LeavesLeftCard({ balance, year }) {
  const cell = (label, left, total, extra = '') => (
    <div className={extra}>
      <small>{label}</small>
      <b className={left <= 0 ? 'out' : ''}>{fmtDays(left)} <i>/ {total}</i></b>
    </div>
  );
  return (
    <Link href="/account" className="bal">
      <span className="bal-h">Leaves left <span>{year.label}</span></span>
      <span className="bal-3">
        {cell('Annual', balance.annual.left, balance.annual.total)}
        {cell('Casual', balance.casual.left, balance.casual.total)}
        {cell('Total', balance.total.left, balance.total.total, 'tot')}
      </span>
      <span className="bal-link">See details in Account ›</span>
    </Link>
  );
}

function Meter({ label, b }) {
  const pct = (n) => `${Math.max(0, Math.min(100, (n / b.total) * 100))}%`;
  return (
    <div className="meter">
      <div className="top">
        <b>{label}</b>
        <span>
          {fmtDays(b.used)} used · <b className={b.left <= 0 ? 'out' : 'left'}>{fmtDays(b.left)} left</b> of {b.total}
        </span>
      </div>
      <div className="bar" aria-hidden="true">
        <i style={{ width: pct(b.used) }} />
        {b.pending > 0 && <i className="p" style={{ width: pct(b.pending) }} />}
      </div>
    </div>
  );
}

// Full breakdown, used on the staff Account tab and the manager's Staff page.
export function LeaveBreakdown({ balance, year, title = 'Your leave' }) {
  const waiting = ['annual', 'casual'].filter((c) => balance[c].pending > 0);
  const pendingTotal = waiting.reduce((n, c) => n + balance[c].pending, 0);
  const waitingText = `${waiting.map((c) => `${fmtDays(balance[c].pending)} ${c}`).join(' and ')} ${pendingTotal <= 1 ? 'day' : 'days'}`;
  return (
    <div className="card leave-card">
      <div>
        <h2>{title}</h2>
        <span className="sub">{year.long}</span>
      </div>
      <div className="big">
        <b className={balance.total.left <= 0 ? 'out' : ''}>{fmtDays(balance.total.left)}</b>
        <span>days left of {balance.total.total}</span>
      </div>
      <Meter label="Annual" b={balance.annual} />
      <Meter label="Casual" b={balance.casual} />
      <span className="mini">
        {waiting.length > 0 && (
          <><b>{waitingText}</b> waiting for approval (light shading). </>
        )}
        Short leaves this year: {balance.shortCount}
      </span>
    </div>
  );
}

// Approved leave this leave year.
export function LeaveTaken({ rows }) {
  return (
    <div className="card">
      <h2>Leave taken</h2>
      {rows.length === 0 ? (
        <p>No leave taken yet this year.</p>
      ) : (
        <div className="taken">
          {rows.map((r) => {
            const d = describe(r);
            const cat = categoryOf(r);
            const [when] = d.when.split(' · ');
            return (
              <div key={r.id}>
                <span>{cat === 'short' ? d.when : when}</span>
                <small>{cat === 'short' ? 'Short leave' : `${CATEGORY_LABEL[cat]} · ${d.detailLabel.startsWith('Half') ? 'Half day' : 'Full day'}`}</small>
                <em>{cat === 'short' ? d.detailLabel : fmtDays(r.days)}</em>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
