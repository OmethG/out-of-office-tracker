import Link from 'next/link';
import { requireSession } from '../../lib/auth';
import { employeeUsername, getEmployees } from '../../lib/employees';
import { getProfiles } from '../../lib/profiles';
import { birthdaySoon } from '../../lib/staffDates';
import { TitleBar } from '../components/Chrome';
import { NextIcon } from '../components/Icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Staff · MethG Staff' };

// Everyone: the people at MethG, A to Z. Tap a name for their joining date and birthday.
export default async function StaffList() {
  const session = await requireSession();
  const people = [...getEmployees()].sort((a, b) => a.name.localeCompare(b.name));
  const profiles = await getProfiles();
  const base = session.role === 'manager' ? '/manager/staff' : '/staff';

  return (
    <>
      <TitleBar title="Staff" back="/account" />
      <main className="page bare">
        <div className="list">
          {people.map((p) => {
            const soon = birthdaySoon(profiles[p.name]?.birthday);
            return (
              <Link key={p.name} href={`${base}/${employeeUsername(p.name).replace('@methg', '')}`} className="prow">
                <span className="pa">{p.name.charAt(0).toUpperCase()}</span>
                <b>{p.name}</b>
                {soon && <span className="soon">{soon}</span>}
                <NextIcon />
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
