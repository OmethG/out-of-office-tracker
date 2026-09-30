import { requireSession } from '../../lib/auth';
import { TitleBar } from '../components/Chrome';
import StepOutForm from './StepOutForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Step out · MethG Staff' };

export default async function StepOutPage() {
  const session = await requireSession('staff');
  return (
    <>
      <TitleBar title="Step out" />
      <main className="page bare">
        <StepOutForm name={session.name} />
      </main>
    </>
  );
}
