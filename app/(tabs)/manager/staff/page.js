import Link from 'next/link';
import { requireSession } from '../../../../lib/auth';
import { getEmployees, employeeUsername } from '../../../../lib/employees';
import { balancesFor, fmtDays, leaveYear } from '../../../../lib/leave';
import { NextIcon } from '../../../components/Icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Staff · MethG Staff' };

// Manager: everyone's leave left this leave year. Anyone who has used up annual or casual leave shows in red.
export default async function Staff() {
  await requireSession('manager');
  const year = leaveYear();
  const people = [...getEmployees()].sort((a, b) => a.name.localeCompare(b.name));
  const bal = await balancesFor(people.map((p) => p.name), year);

  return (
    <main className="page">
      <div className="hello">
        <h1>Staff</h1>
        <span className="sub">Leaves left · {year.long}</span>
      </div>
      <div className="list">
        {people.map((p) => {
          const b = bal[p.name];
          const outA = b.annual.left <= 0;
          const outC = b.casual.left <= 0;
          return (
            <Link key={p.name} href={`/manager/staff/${employeeUsername(p.name).replace('@methg', '')}`} className={`brow ${outA || outC ? 'low' : ''}`}>
              <b>{p.name}</b>
              <small>
                <span className={outA ? 'out' : ''}>Annual {fmtDays(b.annual.left)}</span>
                {' · '}
                <span className={outC ? 'out' : ''}>Casual {fmtDays(b.casual.left)}</span>
              </small>
              <em>{fmtDays(b.total.left)}<i>of {b.total.total}</i></em>
              <NextIcon />
            </Link>
          );
        })}
      </div>
    </main>
  );
}
