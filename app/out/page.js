import { requireSession } from '../../lib/auth';
import { whoIsOut } from '../../lib/out';
import { TitleBar } from '../components/Chrome';
import { OutRows } from '../components/OutList';

export const dynamic = 'force-dynamic';
export const metadata = { title: "Who's out · MethG Staff" };

// Everyone: who is out today and over the next working days.
export default async function WhoIsOut() {
  const session = await requireSession();
  const manager = session.role === 'manager';
  const days = await whoIsOut({ days: 7, manager });
  return (
    <>
      <TitleBar title="Who's out" back={manager ? '/manager' : '/'} />
      <main className="page bare outweek">
        {days.map((d) => (
          <section key={d.day}>
            <h2 className="daylbl">{d.today ? `Today · ${d.label}` : d.label}</h2>
            <OutRows people={d.people} empty="Everyone's in." />
          </section>
        ))}
      </main>
    </>
  );
}
