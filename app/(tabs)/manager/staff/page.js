import Link from 'next/link';
import { requireSession } from '../../../../lib/auth';
import { getEmployees, employeeUsername } from '../../../../lib/employees';
import { FREE_MEDICAL, balancesFor, fmtDays, leaveYear } from '../../../../lib/leave';
import { NextIcon } from '../../../components/Icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Staff · MethG Staff' };

// Manager: days taken of each leave type this leave year, and total days left. Red means a type is used up.
export default async function Staff() {
  await requireSession('manager');
  const year = leaveYear();
  const people = [...getEmployees()].sort((a, b) => a.name.localeCompare(b.name));
  const bal = await balancesFor(people.map((p) => p.name), year);

  return (
    <main className="page">
      <div className="hello">
        <h1>Staff</h1>
        <span className="sub">{year.long}</span>
      </div>
      <div className="list">
        {people.map((p) => {
          const b = bal[p.name];
          const outA = b.annual.left <= 0;
          const outC = b.casual.left <= 0;
          const med = b.medicalCount;
          return (
            <Link key={p.name} href={`/manager/staff/${employeeUsername(p.name).replace('@methg', '')}`} className={`srow ${outA || outC ? 'low' : ''}`}>
              <b>{p.name}</b>
              <em>{fmtDays(b.total.left)}<i>left of {b.total.total}</i></em>
              <span className="used">
                <i className={outA ? 'out' : ''}>Annual <b>{fmtDays(b.annual.used)}</b> taken</i>
                <i className={outC ? 'out' : ''}>Casual <b>{fmtDays(b.casual.used)}</b> taken</i>
              </span>
              <small className={`med ${med >= FREE_MEDICAL ? 'warn' : ''}`}>
                {med === 0 ? 'No medical leave' : `${med} medical ${med === 1 ? 'leave' : 'leaves'}`}
                {med >= FREE_MEDICAL && ' · certificate needed now'}
              </small>
              <NextIcon />
            </Link>
          );
        })}
      </div>
      <p className="hintline">Days <b>taken</b> this leave year. Medical leave is counted inside casual. Red means used up.</p>
    </main>
  );
}
