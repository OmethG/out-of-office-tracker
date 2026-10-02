import Link from 'next/link';

// One day's list of who is out. Used on staff Home, manager Approvals and the "Who's out" screen.
export function OutRows({ people, empty = "Everyone's in today." }) {
  if (people.length === 0) return <div className="nobody">{empty}</div>;
  return (
    <div className="list">
      {people.map((p) => (
        <div key={p.id} className={`orow ${p.back ? 'in' : ''}`}>
          <span className={`oa ${p.tone}`} aria-hidden="true">{p.name.charAt(0).toUpperCase()}</span>
          <b>{p.name}</b>
          <small>{p.detail}</small>
          <em className={p.chipTone}>{p.chip}</em>
        </div>
      ))}
    </div>
  );
}

export function OutToday({ day }) {
  return (
    <>
      <div className="sechead">
        Out today
        <Link href="/out">This week ›</Link>
      </div>
      <OutRows people={day.people} />
    </>
  );
}
