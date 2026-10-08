import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '../../../../../lib/auth';
import { findEmployeeByUsername } from '../../../../../lib/employees';
import { balanceFor, leaveTaken, leaveYear } from '../../../../../lib/leave';
import { LeaveBreakdown, LeaveTaken } from '../../../../components/LeaveSummary';
import { BackIcon } from '../../../../components/Icons';
import StaffFacts from '../../../../components/StaffFacts';
import { getProfile } from '../../../../../lib/profiles';
import EditDates from './EditDates';

export const dynamic = 'force-dynamic';

// Manager: one person's joining date and birthday (editable), then their leave, the same breakdown they see in their Account.
export default async function StaffMember({ params }) {
  await requireSession('manager');
  const { who } = await params;
  const person = findEmployeeByUsername(`${decodeURIComponent(who)}@methg`);
  if (!person) notFound();
  const year = leaveYear();
  const [balance, taken, profile] = await Promise.all([
    balanceFor(person.name, year),
    leaveTaken(person.name, year),
    getProfile(person.name),
  ]);

  return (
    <main className="page">
      <div className="hello" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/manager/staff" className="back" aria-label="Back to Staff"><BackIcon /></Link>
        <h1>{person.name}</h1>
      </div>
      <StaffFacts profile={profile} showEmpty />
      <EditDates who={decodeURIComponent(who)} joined={profile.joined} birthday={profile.birthday} />
      <LeaveBreakdown balance={balance} year={year} title={`${person.name}'s leave`} />
      <LeaveTaken rows={taken} />
    </main>
  );
}
