import { requireSession } from '../../lib/auth';
import { localDate } from '../../lib/time';
import { TitleBar } from '../components/Chrome';
import LeaveForm from './LeaveForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Request leave · MethG Staff' };

export default async function LeavePage() {
  await requireSession('staff');
  return (
    <>
      <TitleBar title="Request leave" />
      <main className="page bare">
        <LeaveForm today={localDate()} />
      </main>
    </>
  );
}
