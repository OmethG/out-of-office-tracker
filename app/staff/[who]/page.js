import { notFound, redirect } from 'next/navigation';
import { requireSession } from '../../../lib/auth';
import { findEmployeeByUsername } from '../../../lib/employees';
import { getProfile } from '../../../lib/profiles';
import { TitleBar } from '../../components/Chrome';
import StaffFacts from '../../components/StaffFacts';

export const dynamic = 'force-dynamic';

// Everyone: one person's joining date and birthday. Nothing else about them.
export default async function StaffPerson({ params }) {
  const session = await requireSession();
  const { who } = await params;
  if (session.role === 'manager') redirect(`/manager/staff/${encodeURIComponent(who)}`);
  const person = findEmployeeByUsername(`${decodeURIComponent(who)}@methg`);
  if (!person) notFound();
  const profile = await getProfile(person.name);
  const empty = !profile.joined && !profile.birthday;

  return (
    <>
      <TitleBar title="Staff" back="/staff" />
      <main className="page bare">
        <div className="hero">
          <span className="avatar">{person.name.charAt(0).toUpperCase()}</span>
          <b>{person.name}</b>
        </div>
        <StaffFacts profile={profile} />
        {empty && <p className="hintline">No dates added yet.</p>}
      </main>
    </>
  );
}
