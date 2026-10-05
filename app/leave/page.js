import { requireSession } from '../../lib/auth';
import { localDate } from '../../lib/time';
import { TitleBar } from '../components/Chrome';
import LeaveForm from './LeaveForm';
import { balanceFor } from '../../lib/leave';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Request leave · MethG Staff' };

export default async function LeavePage() {
  const session = await requireSession('staff');
  const balance = await balanceFor(session.name);
  return (
    <>
      <TitleBar title="Request leave" />
      <main className="page bare">
        <LeaveForm today={localDate()} balance={{ annual: balance.annual, casual: balance.casual }} medicalCount={balance.medicalCount} />
      </main>
    </>
  );
}
